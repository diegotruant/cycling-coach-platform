import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client with service role key for privileged operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Bucket name for athlete documents
export const DOCUMENTS_BUCKET = 'athlete-documents';

/**
 * Initialize the documents bucket if it doesn't exist
 */
export async function ensureDocumentsBucket() {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();

    const bucketExists = buckets?.some(b => b.name === DOCUMENTS_BUCKET);

    if (!bucketExists) {
        const { error } = await supabaseAdmin.storage.createBucket(DOCUMENTS_BUCKET, {
            public: false, // Documents are private, accessed via signed URLs
            fileSizeLimit: 10 * 1024 * 1024, // 10MB max
            allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif']
        });

        if (error) {
            console.error('Error creating documents bucket:', error);
            throw error;
        }
        console.log('Created documents bucket:', DOCUMENTS_BUCKET);
    }
}

/**
 * Upload a document to Supabase Storage
 */
export async function uploadDocument(
    athleteId: string,
    documentType: string,
    file: File | Buffer,
    filename: string
): Promise<{ url: string; path: string }> {
    await ensureDocumentsBucket();

    const filePath = `${athleteId}/${documentType}/${filename}`;

    let fileData: Buffer;
    if (Buffer.isBuffer(file)) {
        fileData = file;
    } else {
        // It's a File object
        fileData = Buffer.from(await (file as File).arrayBuffer());
    }

    const { data, error } = await supabaseAdmin.storage
        .from(DOCUMENTS_BUCKET)
        .upload(filePath, fileData, {
            contentType: getContentType(filename),
            upsert: true // Overwrite if exists
        });

    if (error) {
        console.error('Error uploading document:', error);
        throw error;
    }

    return {
        path: data.path,
        url: `/api/documents/${athleteId}/${documentType}/${filename}`
    };
}

/**
 * Get a signed URL for downloading a document (valid for 1 hour)
 */
export async function getDocumentSignedUrl(path: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(path, 60 * 60); // 1 hour expiry

    if (error) {
        console.error('Error creating signed URL:', error);
        return null;
    }

    return data.signedUrl;
}

/**
 * Download a document from Supabase Storage
 */
export async function downloadDocument(path: string): Promise<Buffer | null> {
    const { data, error } = await supabaseAdmin.storage
        .from(DOCUMENTS_BUCKET)
        .download(path);

    if (error) {
        console.error('Error downloading document:', error);
        return null;
    }

    return Buffer.from(await data.arrayBuffer());
}

/**
 * Delete a document from Supabase Storage
 */
export async function deleteDocument(path: string): Promise<boolean> {
    const { error } = await supabaseAdmin.storage
        .from(DOCUMENTS_BUCKET)
        .remove([path]);

    if (error) {
        console.error('Error deleting document:', error);
        return false;
    }

    return true;
}

/**
 * List all documents for an athlete
 */
export async function listAthleteDocuments(athleteId: string): Promise<{
    name: string;
    path: string;
    type: string;
    size: number;
    createdAt: string;
}[]> {
    const { data, error } = await supabaseAdmin.storage
        .from(DOCUMENTS_BUCKET)
        .list(athleteId, {
            sortBy: { column: 'created_at', order: 'desc' }
        });

    if (error || !data) {
        console.error('Error listing documents:', error);
        return [];
    }

    const documents: any[] = [];

    for (const folder of data) {
        if (folder.id) continue; // Skip if it's a file, not a folder

        const { data: files } = await supabaseAdmin.storage
            .from(DOCUMENTS_BUCKET)
            .list(`${athleteId}/${folder.name}`);

        if (files) {
            for (const file of files) {
                if (file.id) {
                    documents.push({
                        name: file.name,
                        path: `${athleteId}/${folder.name}/${file.name}`,
                        type: folder.name,
                        size: file.metadata?.size || 0,
                        createdAt: file.created_at
                    });
                }
            }
        }
    }

    return documents;
}

function getContentType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
        case 'pdf': return 'application/pdf';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'gif': return 'image/gif';
        default: return 'application/octet-stream';
    }
}
