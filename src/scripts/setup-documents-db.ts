
import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setupDocumentsTable() {
    const client = await pool.connect();
    try {
        console.log('Connect to database...');

        await client.query('BEGIN');

        // 1. Ensure UUID extension exists
        console.log('Checking uuid-ossp extension...');
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

        // 2. Create Table
        console.log('Creating athlete_documents table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS athlete_documents (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                file_url TEXT,
                storage_path TEXT,
                status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UPLOADED', 'VERIFIED', 'EXPIRED', 'REJECTED')),
                expiration_date DATE,
                uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB DEFAULT '{}'::JSONB
            );
        `);

        // 3. Create Index
        console.log('Creating indexes...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_athlete_documents_athlete_id ON athlete_documents(athlete_id);
        `);

        // 4. Enable RLS
        console.log('Enabling RLS...');
        await client.query(`
            ALTER TABLE athlete_documents ENABLE ROW LEVEL SECURITY;
        `);

        // 5. Create Policy (Drop if exists first to avoid error on rerun)
        console.log('Configuring Policies...');
        await client.query(`
            DROP POLICY IF EXISTS "Service Role can do everything on athlete_documents" ON athlete_documents;
        `);

        await client.query(`
            CREATE POLICY "Service Role can do everything on athlete_documents"
            ON athlete_documents
            USING (true)
            WITH CHECK (true);
        `);

        await client.query('COMMIT');
        console.log('SUCCESS: Setup completed successfully!');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('ERROR during setup:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

setupDocumentsTable();
