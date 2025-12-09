'use client';

import { useState } from 'react';
import { uploadDocument } from '@/app/actions/onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader2, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast'; // Assuming we have toast, if not I'll use simple alert or state

export default function UploadDocumentForm({ athleteId, type, isUploaded }: { athleteId: string, type: string, isUploaded: boolean }) {
    const [uploading, setUploading] = useState(false);

    async function handleUpload(formData: FormData) {
        setUploading(true);
        formData.append('type', type);

        const result = await uploadDocument(athleteId, formData);

        setUploading(false);
        if (!result.success) {
            alert('Upload failed: ' + result.error);
        }
    }

    if (isUploaded) {
        return (
            <div className="flex items-center gap-2 text-green-600 font-medium">
                <Check className="h-4 w-4" />
                Documento caricato
                <Button variant="link" className="text-sm h-auto p-0 ml-2" onClick={() => document.getElementById(`file-${type}`)?.click()}>
                    (Modifica)
                </Button>
                <form action={handleUpload} className="hidden">
                    <input
                        id={`file-${type}`}
                        type="file"
                        name="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => e.target.form?.requestSubmit()}
                    />
                </form>
            </div>
        );
    }

    return (
        <form action={handleUpload} className="flex items-center gap-4">
            <Input
                type="file"
                name="file"
                accept=".pdf,.jpg,.jpeg,.png"
                required
                className="max-w-sm"
            />
            <Button type="submit" disabled={uploading}>
                {uploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Caricamento...
                    </>
                ) : (
                    <>
                        <Upload className="mr-2 h-4 w-4" />
                        Carica
                    </>
                )}
            </Button>
        </form>
    );
}
