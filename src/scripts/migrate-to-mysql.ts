
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto'; // Needed for UUIDs if randomUUID not available globally

// Configurazione DB (corrisponde al docker-compose)
const dbConfig = {
    host: 'localhost',
    user: 'coach',
    password: 'coachpassword',
    database: 'cycling_coach',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
};

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
    console.log('🚀 Inizio migrazione da JSON a MySQL...');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connesso al Database MySQL.');

        // 0. Apply Schema
        console.log('📜 Applicazione schema database...');
        const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
        const schemaSql = await fs.readFile(schemaPath, 'utf-8');
        await connection.query(schemaSql);
        console.log('✅ Schema applicato.');

    } catch (e) {
        console.error('❌ Errore connessione o schema.');
        console.error(e);
        return;
    }

    try {
        // 1. Leggi tutti gli atleti dal filesystem DIRETTAMENTE (bypassando storage.ts che potrebbe usare MySQL)
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
            await connection.execute(`
                    INSERT INTO athletes (id, name, email, status, dob, weight, height, sex, category, ftp, cp, w_prime, p_max, extra_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), ftp=VALUES(ftp), extra_data=VALUES(extra_data);
                `, [
                athlete.id, athlete.name, athlete.email, athlete.status || 'ACTIVE', athlete.dob || null, athlete.weight || null,
                athlete.height || null, athlete.sex || null, athlete.category || null, athlete.ftp || null, athlete.cp || null,
                athlete.w_prime || null, athlete.p_max || null, JSON.stringify(extraData)
            ]);

            // INSERT ASSIGNMENTS
            if (athlete.assignments && athlete.assignments.length > 0) {
                console.log(`   - Migrating ${athlete.assignments.length} assignments...`);
                const values = athlete.assignments.map((a: any) => [
                    a.id || crypto.randomUUID(), athlete.id, a.date, a.workoutId, a.workoutName, a.status || 'PENDING', a.notes, a.assignedBy,
                    JSON.stringify(a.workoutStructure || {}), JSON.stringify(a.activityData || {})
                ]);
                for (const val of values) {
                    await connection.execute(`
                            INSERT INTO assignments (id, athlete_id, date, workout_id, workout_name, status, notes, assigned_by, workout_structure, activity_data)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE status=VALUES(status);
                        `, val);
                }
            }

            // INSERT MESOCYCLES
            if (athlete.mesocycles && athlete.mesocycles.length > 0) {
                console.log(`   - Migrating ${athlete.mesocycles.length} mesocycles...`);
                // Use explicit mapping to avoid undefined
                const values = athlete.mesocycles.map((m: any) => [
                    m.id || crypto.randomUUID(), athlete.id, m.name, m.startDate, m.endDate, m.status || 'PENDING_APPROVAL', JSON.stringify(m.weeklyStructure || {})
                ]);
                for (const val of values) {
                    await connection.execute(`
                        INSERT INTO mesocycles (id, athlete_id, name, start_date, end_date, status, structure)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE status=VALUES(status);
                    `, val);
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
                        try {
                            await connection.execute(`
                                INSERT INTO diary_entries (id, athlete_id, date, hrv, hrr, traffic_light, notes, sdnn, pnn50, cv, mean_rr, sleep_quality, sleep_duration, rpe, soreness, fatigue, stress)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE hrv=VALUES(hrv);
                            `, [
                                crypto.randomUUID(), athlete.id, entry.date,
                                entry.hrv || null, entry.hrr || null, entry.trafficLight || 'GREEN', entry.notes || null,
                                entry.sdnn || null, entry.pnn50 || null, entry.cv || null, entry.meanRR || null,
                                entry.sleepQuality || null, entry.sleepDuration || null, entry.rpe || null,
                                entry.soreness || null, entry.fatigue || null, entry.stress || null
                            ]);
                        } catch (err: any) {
                            if (err.code !== 'ER_DUP_ENTRY') console.error('Error inserting diary:', err.message);
                        }
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
                        await connection.execute(`
                            INSERT INTO reports (id, athlete_id, date, content, generated_by)
                            VALUES (?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE content=VALUES(content);
                        `, [rep.id || crypto.randomUUID(), athlete.id, rep.date, rep.content, rep.generatedBy || 'AI']);
                    }
                }
            } catch { }
        }

        console.log('\n✨ Migrazione completata con successo!');

    } catch (error) {
        console.error('Errore durante la migrazione:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

migrate();
