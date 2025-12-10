import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function listAllFiles() {
    console.log('Listing all files in athlete-documents bucket...\n');

    // List root folders (athlete IDs)
    const { data: folders } = await supabase.storage.from('athlete-documents').list('');

    if (!folders || folders.length === 0) {
        console.log('No folders found');
        return;
    }

    for (const folder of folders) {
        console.log(`📁 ${folder.name}/`);

        // List subfolders (document types)
        const { data: subfolders } = await supabase.storage.from('athlete-documents').list(folder.name);

        if (subfolders) {
            for (const subfolder of subfolders) {
                if (!subfolder.id) {
                    // It's a folder (document type)
                    console.log(`   📁 ${subfolder.name}/`);

                    // List files
                    const { data: files } = await supabase.storage.from('athlete-documents').list(`${folder.name}/${subfolder.name}`);

                    if (files) {
                        for (const file of files) {
                            if (file.id) {
                                console.log(`      📄 ${file.name} (${file.metadata?.size || '?'} bytes)`);

                                // Generate signed URL
                                const { data: urlData } = await supabase.storage
                                    .from('athlete-documents')
                                    .createSignedUrl(`${folder.name}/${subfolder.name}/${file.name}`, 3600);

                                if (urlData) {
                                    console.log(`         URL: ${urlData.signedUrl.substring(0, 80)}...`);
                                }
                            }
                        }
                    }
                } else {
                    // It's a file directly under the athlete folder
                    console.log(`   📄 ${subfolder.name}`);
                }
            }
        }
    }
}

listAllFiles().then(() => console.log('\nDone.')).catch(console.error);
