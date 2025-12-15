import 'dotenv/config';
import { getDocumentSignedUrl } from '../lib/supabase-storage';

async function test() {
    const path = 'omar/MEDICAL_CERTIFICATE/medical_certificate_1765748406800.pdf';
    console.log(`Generating signed URL for: ${path}`);
    const url = await getDocumentSignedUrl(path);
    console.log('Signed URL:', url);
}

test();
