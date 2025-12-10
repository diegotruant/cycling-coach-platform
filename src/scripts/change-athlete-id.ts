
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function changeAthleteId() {
    const oldId = '03b27e27-0cb8-4eac-8899-1f1ae560d45f';
    const newId = 'omar';

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        console.log(`Starting migration from ID '${oldId}' to '${newId}'...`);

        // 1. Get Old Athlete
        const { rows } = await client.query('SELECT * FROM athletes WHERE id = $1', [oldId]);
        if (rows.length === 0) {
            console.error("Old athlete NOT found!");
            await client.query('ROLLBACK');
            return;
        }
        const athlete = rows[0];

        // 1b. TEMP: Rename old email to avoid unique constraint conflict
        await client.query("UPDATE athletes SET email = 'temp_old_' || email WHERE id = $1", [oldId]);

        // 2. Prepare New Data (Update URLs in documents)
        let extraData = athlete.extra_data || {};
        if (typeof extraData === 'string') extraData = JSON.parse(extraData);

        if (extraData.documents && Array.isArray(extraData.documents)) {
            extraData.documents = extraData.documents.map((doc: any) => ({
                ...doc,
                url: doc.url ? doc.url.replace(oldId, newId) : doc.url
            }));
        }

        // 3. Insert New Athlete
        await client.query(`
            INSERT INTO athletes (id, name, email, status, dob, weight, height, sex, category, ftp, cp, w_prime, p_max, created_at, updated_at, extra_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
            newId, athlete.name, athlete.email, athlete.status, athlete.dob, athlete.weight, athlete.height,
            athlete.sex, athlete.category, athlete.ftp, athlete.cp, athlete.w_prime, athlete.p_max,
            athlete.created_at, new Date(), JSON.stringify(extraData)
        ]);
        console.log("✅ Created new athlete record.");

        // 4. Update References matches
        // Assignments
        const resAssign = await client.query('UPDATE assignments SET athlete_id = $1 WHERE athlete_id = $2', [newId, oldId]);
        console.log(`✅ Updated ${resAssign.rowCount} assignments.`);

        // Mesocycles
        const resMeso = await client.query('UPDATE mesocycles SET athlete_id = $1 WHERE athlete_id = $2', [newId, oldId]);
        console.log(`✅ Updated ${resMeso.rowCount} mesocycles.`);

        // Diary Entries
        const resDiary = await client.query('UPDATE diary_entries SET athlete_id = $1 WHERE athlete_id = $2', [newId, oldId]);
        console.log(`✅ Updated ${resDiary.rowCount} diary entries.`);

        // Reports
        const resReports = await client.query('UPDATE reports SET athlete_id = $1 WHERE athlete_id = $2', [newId, oldId]);
        console.log(`✅ Updated ${resReports.rowCount} reports.`);

        // 5. Delete Old Athlete
        await client.query('DELETE FROM athletes WHERE id = $1', [oldId]);
        console.log("✅ Deleted old athlete record.");

        await client.query('COMMIT');
        console.log("\n🎉 MIGRATION SUCCESSFUL! New ID: 'omar'");

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Migration Failed:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

changeAthleteId();
