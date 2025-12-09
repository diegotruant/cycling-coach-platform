
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

console.log('--- DB CONNECTION TEST ---');

if (!connectionString) {
    console.error('❌ DATABASE_URL is missing in .env');
    process.exit(1);
}

// Mask password for logging
try {
    const url = new URL(connectionString);
    console.log(`Target Host: ${url.hostname}`);
    console.log(`Target Port: ${url.port}`);
    console.log(`Target DB:   ${url.pathname}`);
    console.log(`Auth User:   ${url.username}`);
    console.log(`Auth Pass:   ${url.password ? '******' : '(none)'}`);
} catch (e) {
    console.log('Could not parse URL:', connectionString);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Required for Supabase
    connectionTimeoutMillis: 5000,
});

async function test() {
    try {
        console.log('Attempting to connect...');
        const client = await pool.connect();
        console.log('✅ Connected successfully!');

        const res = await client.query('SELECT NOW()');
        console.log('Running query result:', res.rows[0]);

        client.release();
        await pool.end();
    } catch (err: any) {
        console.error('❌ Connection Failed!');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        if (err.position) console.error('Position:', err.position);
    }
}

test();
