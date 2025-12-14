
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDocs() {
    console.log('Checking athlete_documents table...');

    // Get all docs for 'omar' (we need to find his UUID first really, but let's assume we can search by athlete_id if known, or list all)
    // Actually, let's list all documents to see what's in there.

    const { data, error } = await supabase
        .from('athlete_documents')
        .select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Documents found:', data?.length);
    if (data) {
        data.forEach(d => {
            console.log(`ID: ${d.id}`);
            console.log(`Type: ${d.type}`);
            console.log(`File URL: ${d.file_url || 'MISSING'}`);
            console.log(`Storage Path: ${d.storage_path}`);
            console.log('---');
        });
    }
}

checkDocs();
