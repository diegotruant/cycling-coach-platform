import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    console.log('Checking database schema...\n');

    // Check mesocycles table
    const { rows: mesoCols } = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'mesocycles' 
        ORDER BY ordinal_position
    `);
    console.log('MESOCYCLES TABLE:');
    mesoCols.forEach((r: any) => console.log(`  ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable})`));

    // Check constraints
    const { rows: checks } = await pool.query(`
        SELECT conname, pg_get_constraintdef(oid) as def
        FROM pg_constraint 
        WHERE conrelid = 'mesocycles'::regclass AND contype = 'c'
    `);
    console.log('\nMESOCYCLES CHECK CONSTRAINTS:');
    checks.forEach((c: any) => console.log(`  ${c.conname}: ${c.def}`));

    // Check diary_entries table
    const { rows: diaryCols } = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'diary_entries' 
        ORDER BY ordinal_position
    `);
    console.log('\nDIARY_ENTRIES TABLE:');
    diaryCols.forEach((r: any) => console.log(`  ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable})`));

    await pool.end();
}

checkSchema().catch(console.error);
