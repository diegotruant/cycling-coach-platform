'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [testType, setTestType] = useState<string>('NONE');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setStatus('idle');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('testType', testType);

        try {
            const response = await fetch('/api/upload-fit', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setStatus('success');
            setMessage(`Successfully uploaded! Avg Power: ${data.avg_power}W, Max Power: ${data.max_power}W. ${data.message || ''}`);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setMessage('Failed to process file. Please ensure it is a valid .fit file.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Upload Activity</h1>
                <p className="text-muted-foreground mt-2">
                    Upload your .fit file from your cycling computer (Garmin, Wahoo, etc.) to analyze your performance.
                </p>
            </div>

            <div className="grid gap-4 max-w-md mx-auto">
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Was this a specific test?</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={testType}
                        onChange={(e) => setTestType(e.target.value)}
                    >
                        <option value="NONE">No, just a ride</option>
                        <option value="CP3">Critical Power 3 min</option>
                        <option value="CP5">Critical Power 5 min</option>
                        <option value="CP12">Critical Power 12 min</option>
                        <option value="SPRINT">Sprint Profile</option>
                        <option value="RAMP">Ramp Test</option>
                    </select>
                </div>
            </div>

            <div className="rounded-xl border border-dashed border-border p-12 text-center hover:bg-muted/50 transition-colors">
                <input
                    type="file"
                    id="file-upload"
                    accept=".fit"
                    className="hidden"
                    onChange={handleFileChange}
                />

                <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-8 w-8 text-primary" />
                    </div>

                    {file ? (
                        <div className="text-center">
                            <p className="font-medium text-lg">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="font-medium text-lg">Drag and drop or click to upload</p>
                            <p className="text-sm text-muted-foreground">Supported formats: .fit</p>
                        </div>
                    )}

                    <div className="mt-4">
                        {!file ? (
                            <Button asChild>
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    Select File
                                </label>
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setFile(null)}>
                                    Change
                                </Button>
                                <Button onClick={handleUpload} disabled={uploading}>
                                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {uploading ? 'Processing...' : 'Upload & Analyze'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {status === 'success' && (
                <div className="rounded-md bg-green-500/10 p-4 flex items-center gap-3 text-green-500 border border-green-500/20">
                    <CheckCircle className="h-5 w-5" />
                    <p>{message}</p>
                </div>
            )}

            {status === 'error' && (
                <div className="rounded-md bg-red-500/10 p-4 flex items-center gap-3 text-red-500 border border-red-500/20">
                    <AlertCircle className="h-5 w-5" />
                    <p>{message}</p>
                </div>
            )}
        </div>
    );
}
