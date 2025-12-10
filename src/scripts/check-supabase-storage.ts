import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? 'Set (length: ' + supabaseServiceKey.length + ')' : 'NOT SET');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkStorage() {
    console.log('\n=== Checking Supabase Storage ===\n');

    try {
        // List buckets
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (bucketsError) {
            console.error('Error listing buckets:', bucketsError);
            return;
        }

        console.log('Buckets found:', buckets?.length || 0);
        buckets?.forEach(b => {
            console.log(`  - ${b.name} (public: ${b.public})`);
        });

        // Check for athlete-documents bucket
        const docsBucket = buckets?.find(b => b.name === 'athlete-documents');

        if (!docsBucket) {
            console.log('\n⚠️  Bucket "athlete-documents" not found! Creating...');

            const { error: createError } = await supabase.storage.createBucket('athlete-documents', {
                public: false,
                fileSizeLimit: 10 * 1024 * 1024,
                allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif']
            });

            if (createError) {
                console.error('Error creating bucket:', createError);
            } else {
                console.log('✅ Bucket created successfully!');
            }
        } else {
            console.log('\n✅ Bucket "athlete-documents" exists');

            // List files in bucket
            const { data: files, error: filesError } = await supabase.storage
                .from('athlete-documents')
                .list('', { limit: 100 });

            if (filesError) {
                console.error('Error listing files:', filesError);
            } else {
                console.log('\nFiles/Folders in bucket:');
                if (files && files.length > 0) {
                    files.forEach(f => {
                        console.log(`  - ${f.name} (${f.id ? 'file' : 'folder'})`);
                    });
                } else {
                    console.log('  (empty)');
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkStorage();
