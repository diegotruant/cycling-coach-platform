
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createTestUser() {
    try {
        const client = await pool.connect();
        try {
            console.log("Creating Test User...");

            const testUser = {
                id: 'test',
                name: 'Test Athlete',
                email: 'test@example.com',
                password: '123456',
                status: 'ACTIVE',
                dob: '1990-01-01',
                weight: 70,
                height: 175,
                sex: 'M',
                category: 'OPEN',
                ftp: 250,
                cp: 260,
                w_prime: 20000,
                p_max: 1000,
                extra_data: { password: '123456' } // Ensure password is in extra_data too for simple auth check
            };

            await client.query(`
                INSERT INTO athletes (id, name, email, status, dob, weight, height, sex, category, ftp, cp, w_prime, p_max, extra_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (id) DO UPDATE SET
                    extra_data = EXCLUDED.extra_data,
                    email = EXCLUDED.email
            `, [
                testUser.id, testUser.name, testUser.email, testUser.status, testUser.dob, testUser.weight, testUser.height,
                testUser.sex, testUser.category, testUser.ftp, testUser.cp, testUser.w_prime, testUser.p_max, JSON.stringify(testUser.extra_data)
            ]);

            console.log(`✅ Test User Created!`);
            console.log(`🆔 ID: test`);
            console.log(`🔑 PASS: 123456`);

        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error creating test user:", error);
    } finally {
        await pool.end();
    }
}

createTestUser();
