
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing in .env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setPasswords() {
    try {
        console.log("Connecting to database...");
        const client = await pool.connect();

        try {
            console.log("Fetching athletes...");
            const { rows } = await client.query('SELECT id, name, extra_data FROM athletes');

            console.log(`Found ${rows.length} athletes. Updating passwords to '123456'...`);

            for (const row of rows) {
                let extra = row.extra_data || {};

                // Handle case where driver returns string
                if (typeof extra === 'string') {
                    try {
                        extra = JSON.parse(extra);
                    } catch (e) {
                        extra = {};
                    }
                }

                // Set password
                extra.password = '123456';

                await client.query(
                    'UPDATE athletes SET extra_data = $1 WHERE id = $2',
                    [JSON.stringify(extra), row.id]
                );

                console.log(`✅ Password set for: ${row.name} (${row.id})`);
            }

            console.log("\n🎉 SUCCESS! All athletes can now login with password: 123456");

        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error updating passwords:", error);
    } finally {
        await pool.end();
    }
}

setPasswords();
