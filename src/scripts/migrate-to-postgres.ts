
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Configuration (use ENV or fallback)
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cycling_coach';

// DEBUG: Log connection info
try {
    const url = new URL(connectionString);
    console.log('🔌 Tentativo connessione a:', {
        host: url.hostname,
        port: url.port,
        protocol: url.protocol,
        database: url.pathname
    });
} catch (e) {
    console.log('⚠️ Could not parse connection string URL for debug logging');
}

const pool = new Pool({
    connectionString,
    // Supabase requires SSL. We accept self-signed certs (rejectUnauthorized: false) for simplicity in scripts.
    ssl: { rejectUnauthorized: false }
});

const DATA_DIR = path.join(process.cwd(), 'data');
const ATHLETES_DIR = path.join(DATA_DIR, 'Athletes');

async function readAthletesFromFS() {
    try {
        const entries = await fs.readdir(ATHLETES_DIR, { withFileTypes: true });
        const athletes = [];
        for (const entry of entries) {
            if (entry.isDirectory()) {
                try {
                    const configPath = path.join(ATHLETES_DIR, entry.name, 'config.json');
                    const data = await fs.readFile(configPath, 'utf-8');
                    athletes.push(JSON.parse(data));
                } catch (e) { }
            }
        }
        return athletes;
    } catch { return []; }
}

async function migrate() {
    console.log('🚀 Inizio migrazione da JSON a PostgreSQL (Supabase)...');

    let client;
    try {
        client = await pool.connect();
        console.log('✅ Connesso al Database PostgreSQL.');

        // 0. Apply Schema
        console.log('📜 Applicazione schema database...');
        const schemaPath = path.join(process.cwd(), 'database', 'schema.pg.sql');
        const schemaSql = await fs.readFile(schemaPath, 'utf-8');

        // Execute schema commands one by one or whole buffer? 
        // pg driver supports multiple statements if enabled? Actually better to just run it.
        // But schema.pg.sql has multiple statements separated by ;
        // We can split them or run as one block. PG driver `query` can execute multiple statements usually.
        await client.query(schemaSql);
        console.log('✅ Schema applicato.');

        // 1. Leggi tutti gli atleti dal filesystem
        const athletes = await readAthletesFromFS();
        console.log(`📦 Trovati ${athletes.length} atleti nei file JSON.`);

        for (const athlete of athletes) {
            console.log(`\nProcessing Athlete: ${athlete.name} (${athlete.id})...`);

            // Prepare Extra Data
            const extraData = { ...athlete };
            delete (extraData as any).id; delete (extraData as any).name; delete (extraData as any).email;
            delete (extraData as any).status; delete (extraData as any).dob; delete (extraData as any).weight;
            delete (extraData as any).height; delete (extraData as any).sex; delete (extraData as any).category;
            delete (extraData as any).ftp; delete (extraData as any).cp; delete (extraData as any).w_prime;
            delete (extraData as any).p_max; delete (extraData as any).assignments; delete (extraData as any).mesocycles;

            // INSERT ATHLETE
            await client.query(`
                    INSERT INTO athletes (id, name, email, status, dob, weight, height, sex, category, ftp, cp, w_prime, p_max, extra_data)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        email = EXCLUDED.email,
                        ftp = EXCLUDED.ftp,
                        extra_data = EXCLUDED.extra_data;
                `, [
                athlete.id, athlete.name, athlete.email, athlete.status || 'ACTIVE', athlete.dob || null, athlete.weight || null,
                athlete.height || null, athlete.sex || null, athlete.category || null, athlete.ftp || null, athlete.cp || null,
                athlete.w_prime || null, athlete.p_max || null, JSON.stringify(extraData)
            ]);

            // INSERT ASSIGNMENTS
            if (athlete.assignments && athlete.assignments.length > 0) {
                console.log(`   - Migrating ${athlete.assignments.length} assignments...`);
                for (const a of athlete.assignments) {
                    await client.query(`
                            INSERT INTO assignments (id, athlete_id, date, workout_id, workout_name, status, notes, assigned_by, workout_structure, activity_data)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                            ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;
                        `, [
                        a.id || crypto.randomUUID(), athlete.id, a.date, a.workoutId, a.workoutName, a.status || 'PENDING', a.notes, a.assignedBy,
                        JSON.stringify(a.workoutStructure || {}), JSON.stringify(a.activityData || {})
                    ]);
                }
            }

            // INSERT MESOCYCLES
            if (athlete.mesocycles && athlete.mesocycles.length > 0) {
                console.log(`   - Migrating ${athlete.mesocycles.length} mesocycles...`);
                for (const m of athlete.mesocycles) {
                    const validStatuses = ['PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
                    let status = m.status || 'PENDING_APPROVAL';
                    if (!validStatuses.includes(status)) {
                        console.log(`     ⚠️  Invalid status '${status}' for mesocycle '${m.name}'. Defaulting to 'PENDING_APPROVAL'.`);
                        status = 'PENDING_APPROVAL';
                    }

                    await client.query(`
                        INSERT INTO mesocycles (id, athlete_id, name, start_date, end_date, status, structure)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;
                    `, [
                        m.id || crypto.randomUUID(), athlete.id, m.name, m.startDate, m.endDate, status, JSON.stringify(m.weeklyStructure || {})
                    ]);
                }
            }

            // INSERT DIARY
            const folderName = `${athlete.name.replace(/[^a-z0-9]/gi, '_')}_${athlete.id}`;
            const diaryPath = path.join(ATHLETES_DIR, folderName, 'diary.json');
            try {
                const diaryContent = await fs.readFile(diaryPath, 'utf-8');
                const diary = JSON.parse(diaryContent);
                if (diary.length > 0) {
                    console.log(`   - Migrating ${diary.length} diary entries...`);
                    for (const entry of diary) {
                        // Diary uses composite key or ID? Schema says ID PRIMARY KEY, and UNIQUE(athlete_id, date).
                        // We generate ID if missing.
                        await client.query(`
                                INSERT INTO diary_entries (id, athlete_id, date, hrv, hrr, traffic_light, notes, sdnn, pnn50, cv, mean_rr, sleep_quality, sleep_duration, rpe, soreness, fatigue, stress)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                                ON CONFLICT (athlete_id, date) DO UPDATE SET hrv = EXCLUDED.hrv;
                            `, [
                            crypto.randomUUID(), athlete.id, entry.date,
                            entry.hrv || null, entry.hrr || null, entry.trafficLight || 'GREEN', entry.notes || null,
                            entry.sdnn || null, entry.pnn50 || null, entry.cv || null, entry.meanRR || null,
                            entry.sleepQuality || null, entry.sleepDuration || null, entry.rpe || null,
                            entry.soreness || null, entry.fatigue || null, entry.stress || null
                        ]);
                    }
                }
            } catch { }

            // INSERT REPORTS
            const reportsPath = path.join(ATHLETES_DIR, folderName, 'reports.json');
            try {
                const reportsContent = await fs.readFile(reportsPath, 'utf-8');
                const reports = JSON.parse(reportsContent);
                if (reports.length > 0) {
                    console.log(`   - Migrating ${reports.length} reports...`);
                    for (const rep of reports) {
                        await client.query(`
                            INSERT INTO reports (id, athlete_id, date, content, generated_by)
                            VALUES ($1, $2, $3, $4, $5)
                            ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;
                        `, [rep.id || crypto.randomUUID(), athlete.id, rep.date, rep.content, rep.generatedBy || 'AI']);
                    }
                }
            } catch { }
        }

        console.log('\n✨ Migrazione a PostgreSQL completata con successo!');

    } catch (error) {
        console.error('Errore durante la migrazione:', error);
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
    }
}

migrate();
