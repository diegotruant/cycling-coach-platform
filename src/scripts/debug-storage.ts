
import 'dotenv/config';
import { supabaseAdmin } from '../lib/supabase-storage';

async function listFiles() {
    console.log('Listing buckets...');
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
    if (bucketError) {
        console.error('Error listing buckets:', bucketError);
        return;
    }
    console.log('Buckets:', buckets.map(b => b.name));

    const bucketName = 'athlete-documents';
    console.log(`Listing files in ${bucketName}/omar...`);

    // Try listing at root
    const { data: rootFiles, error: rootError } = await supabaseAdmin.storage.from(bucketName).list('omar');
    if (rootError) {
        console.error('Error listing root:', rootError);
    } else {
        console.log('Files in omar/:', rootFiles);

        // Try recursive or specific folders if we see folders
        for (const f of rootFiles || []) {
            console.log(`Checking ${f.name}...`);
            if (!f.metadata) { // Likely a folder if no metadata (Supabase specific behavior sometimes)
                const { data: subFiles } = await supabaseAdmin.storage.from(bucketName).list(`omar/${f.name}`);
                console.log(`Files in omar/${f.name}:`, subFiles);
            }
        }
    }
}

listFiles();
