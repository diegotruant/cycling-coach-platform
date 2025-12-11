/**
 * Script to reset document status for an athlete
 * This allows them to re-upload documents
 * Run with: npx tsx src/scripts/reset-documents.ts diego
 */

import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function resetDocuments(athleteId: string) {
    console.log(`\n=== Resetting documents for ${athleteId} ===\n`);

    try {
        // Get current athlete data
        const { rows } = await pool.query(
            "SELECT id, name, extra_data FROM athletes WHERE id = $1",
            [athleteId]
        );

        if (rows.length === 0) {
            console.log(`Athlete ${athleteId} not found`);
            return;
        }

        const row = rows[0];
        const extraData = row.extra_data || {};

        console.log(`Current documents: ${JSON.stringify(extraData.documents, null, 2)}`);

        // Reset documents to empty array
        const newExtraData = { ...extraData, documents: [] };

        await pool.query(
            "UPDATE athletes SET extra_data = $1 WHERE id = $2",
            [JSON.stringify(newExtraData), athleteId]
        );

        console.log(`\nDocuments reset for ${athleteId}`);
        console.log('The athlete can now re-upload their documents from /athlete/documents');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

const athleteId = process.argv[2] || 'diego';
resetDocuments(athleteId);
