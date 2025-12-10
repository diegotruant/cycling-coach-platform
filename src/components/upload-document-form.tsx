'use client';

import { useState, useRef } from 'react';
import { uploadDocument } from '@/app/actions/onboarding';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Check, RefreshCw } from 'lucide-react';

interface UploadDocumentFormProps {
    athleteId: string;
    documentType: string;
    // Legacy props for backward compatibility
    type?: string;
    isUploaded?: boolean;
    // New flexible props
    buttonText?: string;
    buttonVariant?: 'default' | 'outline' | 'ghost' | 'link';
}

export default function UploadDocumentForm({
    athleteId,
    documentType,
    type,
    isUploaded,
    buttonText,
    buttonVariant = 'default'
}: UploadDocumentFormProps) {
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use documentType or legacy type prop
    const docType = documentType || type || '';

    async function handleUpload(formData: FormData) {
        setUploading(true);
        setSuccess(false);
        formData.append('type', docType);

        const result = await uploadDocument(athleteId, formData);

        setUploading(false);
        if (result.success) {
            setSuccess(true);
            // Reset after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } else {
            alert('Upload failed: ' + result.error);
        }
    }

    function handleButtonClick() {
        fileInputRef.current?.click();
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files.length > 0) {
            e.target.form?.requestSubmit();
        }
    }

    // Legacy mode: show simple "uploaded" state
    if (isUploaded !== undefined && isUploaded) {
        return (
            <div className="flex items-center gap-2 text-green-600 font-medium">
                <Check className="h-4 w-4" />
                Documento caricato
                <Button variant="link" className="text-sm h-auto p-0 ml-2" onClick={handleButtonClick}>
                    (Modifica)
                </Button>
                <form action={handleUpload} className="hidden">
                    <input
                        ref={fileInputRef}
                        type="file"
                        name="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                    />
                </form>
            </div>
        );
    }

    // New flexible mode
    const displayText = success
        ? 'Caricato!'
        : buttonText || 'Carica documento';

    const Icon = success ? Check : (buttonText?.includes('Ricarica') ? RefreshCw : Upload);

    return (
        <form action={handleUpload}>
            <input
                ref={fileInputRef}
                type="file"
                name="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
            />
            <Button
                type="button"
                variant={success ? 'outline' : buttonVariant}
                onClick={handleButtonClick}
                disabled={uploading}
                className={`w-full ${success ? 'text-green-600 border-green-600' : ''}`}
            >
                {uploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Caricamento...
                    </>
                ) : (
                    <>
                        <Icon className="mr-2 h-4 w-4" />
                        {displayText}
                    </>
                )}
            </Button>
        </form>
    );
}
