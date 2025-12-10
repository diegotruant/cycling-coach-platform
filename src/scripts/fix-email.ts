
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixEmail() {
    try {
        const client = await pool.connect();
        try {
            const id = '03b27e27-0cb8-4eac-8899-1f1ae560d45f';
            const newEmail = 'omartec.op@gmail.com';

            console.log(`Updating email for athlete ${id}...`);

            await client.query('UPDATE athletes SET email = $1 WHERE id = $2', [newEmail, id]);

            console.log(`✅ Email updated to: ${newEmail}`);

        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error updating email:", error);
    } finally {
        await pool.end();
    }
}

fixEmail();
