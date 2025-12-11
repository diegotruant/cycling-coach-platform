/**
 * Script to check and fix document URLs in the database
 * Run with: npx tsx src/scripts/fix-document-urls.ts
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAndFixDocuments() {
    console.log('=== Checking Document URLs ===');

    try {
        // Get athlete diego specifically
        const { rows } = await pool.query("SELECT id, name, extra_data FROM athletes WHERE id = 'diego'");

        for (const row of rows) {
            console.log(`Athlete: ${row.name} (${row.id})`);

            const extraData = row.extra_data || {};
            const documents = extraData.documents || [];

            if (documents.length === 0) {
                console.log('No documents found in DB');
                continue;
            }

            console.log(`Found ${documents.length} documents:`);

            for (const doc of documents) {
                console.log(`  Type: ${doc.type}`);
                console.log(`  Status: ${doc.status}`);
                console.log(`  URL: ${doc.url || 'NOT SET'}`);
                console.log(`  StoragePath: ${doc.storagePath || 'NOT SET'}`);
                console.log(`  Filename: ${doc.filename || 'NOT SET'}`);
                console.log('  ---');
            }
        }

        // List files in Supabase Storage for diego
        console.log('\n=== Files in Supabase Storage (diego) ===');

        const { data: subfolders } = await supabase.storage
            .from('athlete-documents')
            .list('diego');

        if (subfolders) {
            for (const subfolder of subfolders) {
                if (!subfolder.id) {
                    // It's a folder (document type)
                    const { data: files } = await supabase.storage
                        .from('athlete-documents')
                        .list(`diego/${subfolder.name}`);

                    if (files && files.length > 0) {
                        for (const file of files) {
                            const fullPath = `diego/${subfolder.name}/${file.name}`;
                            const correctUrl = `/api/documents/${fullPath}`;
                            console.log(`  File: diego/${subfolder.name}/${file.name}`);
                            console.log(`  Correct URL: ${correctUrl}`);
                        }
                    }
                } else {
                    // It's a file directly
                    console.log(`  File (root): ${subfolder.name}`);
                }
            }
        } else {
            console.log('No files found for diego');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkAndFixDocuments();
