import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration...');

        const sqlPath = path.join(process.cwd(), 'database', 'create_coaches_table.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        await client.query(sql);

        // Optionally insert the first coach if email provided via ARG
        const coachEmail = process.argv[2];
        if (coachEmail) {
            console.log(`Inserting coach: ${coachEmail}`);
            await client.query(`
                INSERT INTO coaches (email, name) 
                VALUES ($1, $2)
                ON CONFLICT (email) DO NOTHING
            `, [coachEmail, 'Head Coach']);
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
