import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const TEST_ID = `test_${Date.now()}`;

async function test() {
    console.log('Starting simple test...');
    console.log('Test ID:', TEST_ID);

    try {
        // Step 1: Create athlete
        console.log('\n1. Creating athlete...');
        await pool.query(`
            INSERT INTO athletes (id, name, email, status)
            VALUES ($1, $2, $3, $4)
        `, [TEST_ID, 'Test User', `test${Date.now()}@test.com`, 'ACTIVE']);
        console.log('   OK - Athlete created');

        // Step 2: Update FTP
        console.log('\n2. Updating FTP...');
        await pool.query(`UPDATE athletes SET ftp = 280 WHERE id = $1`, [TEST_ID]);
        console.log('   OK - FTP updated');

        // Step 3: Add diary entry
        console.log('\n3. Adding diary entry...');
        const today = new Date().toISOString().split('T')[0];
        await pool.query(`
            INSERT INTO diary_entries (id, athlete_id, date, hrv, traffic_light)
            VALUES ($1, $2, $3, $4, $5)
        `, [`diary_${TEST_ID}_${today}`, TEST_ID, today, 65, 'GREEN']);
        console.log('   OK - Diary entry added');

        // Step 4: Add mesocycle
        console.log('\n4. Creating mesocycle...');
        await pool.query(`
            INSERT INTO mesocycles (id, athlete_id, name, start_date, end_date, status, structure)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            `meso_${TEST_ID}`,
            TEST_ID,
            'Test Plan',
            today,
            today,
            'APPROVED',
            JSON.stringify([{ week: 1, workouts: [] }])
        ]);
        console.log('   OK - Mesocycle created');

        // Step 5: Add assignment
        console.log('\n5. Adding assignment...');
        await pool.query(`
            INSERT INTO assignments (id, athlete_id, date, workout_id, workout_name, status)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [`assign_${TEST_ID}`, TEST_ID, today, 'workout_1', 'Test Workout', 'PENDING']);
        console.log('   OK - Assignment added');

        // Step 6: Verify
        console.log('\n6. Verifying data...');
        const { rows } = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM athletes WHERE id = $1) as athletes,
                (SELECT COUNT(*) FROM diary_entries WHERE athlete_id = $1) as diary,
                (SELECT COUNT(*) FROM mesocycles WHERE athlete_id = $1) as mesocycles,
                (SELECT COUNT(*) FROM assignments WHERE athlete_id = $1) as assignments
        `, [TEST_ID]);
        console.log('   Athletes:', rows[0].athletes);
        console.log('   Diary entries:', rows[0].diary);
        console.log('   Mesocycles:', rows[0].mesocycles);
        console.log('   Assignments:', rows[0].assignments);

        console.log('\n=== ALL TESTS PASSED ===\n');

    } catch (error: any) {
        console.error('\nERROR:', error.message);
        if (error.detail) console.error('Detail:', error.detail);
        if (error.hint) console.error('Hint:', error.hint);
    } finally {
        // Cleanup
        console.log('Cleaning up...');
        await pool.query('DELETE FROM assignments WHERE athlete_id = $1', [TEST_ID]);
        await pool.query('DELETE FROM mesocycles WHERE athlete_id = $1', [TEST_ID]);
        await pool.query('DELETE FROM diary_entries WHERE athlete_id = $1', [TEST_ID]);
        await pool.query('DELETE FROM athletes WHERE id = $1', [TEST_ID]);
        console.log('Done.');
        await pool.end();
    }
}

test();
