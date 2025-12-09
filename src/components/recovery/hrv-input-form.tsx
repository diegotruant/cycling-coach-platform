'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Activity, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';

export function HRVInputForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [rmssd, setRmssd] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rmssd) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/hrv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rmssd: parseFloat(rmssd) })
            });

            if (!res.ok) throw new Error('Failed to save');

            toast({
                title: "HRV Saved",
                description: "Your readiness status has been updated.",
            });

            router.refresh(); // Update dashboard
            router.push('/athlete'); // Redirect to dashboard
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not save HRV data.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                // Simple parser: assume single column of numbers or CSV
                // This logic should ideally be in a shared utility or handled by API if sending raw text
                // For now, let's try to parse numbers here to send JSON array
                const lines = text.split(/\r?\n/);
                const rrIntervals: number[] = [];

                for (const line of lines) {
                    const val = parseFloat(line.trim());
                    if (!isNaN(val) && val > 200 && val < 2000) { // Basic sanity check
                        rrIntervals.push(val);
                    }
                }

                if (rrIntervals.length < 10) {
                    throw new Error("Not enough valid RR intervals found in file.");
                }

                const res = await fetch('/api/hrv', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rrIntervals })
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to process file');
                }

                toast({
                    title: "File Processed",
                    description: "HRV metrics calculated and saved.",
                });

                router.refresh();
                router.push('/athlete');

            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Upload Failed",
                    description: error.message,
                });
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Log HRV Data</CardTitle>
                <CardDescription>Enter your morning readiness data to update your training plan.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="manual">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                        <TabsTrigger value="upload">File Upload</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual">
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="rmssd">RMSSD (ms)</Label>
                                <div className="relative">
                                    <Activity className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="rmssd"
                                        placeholder="e.g. 45"
                                        className="pl-9"
                                        type="number"
                                        step="0.1"
                                        value={rmssd}
                                        onChange={(e) => setRmssd(e.target.value)}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Enter the rMSSD value from your Oura, Garmin, or Apple Watch.
                                </p>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Data'}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="upload">
                        <form onSubmit={handleFileUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="file">RR Intervals File (.txt, .csv)</Label>
                                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('file')?.click()}>
                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                    <span className="text-sm font-medium">
                                        {file ? file.name : "Click to select file"}
                                    </span>
                                    <span className="text-xs text-muted-foreground mt-1">
                                        Supports single column CSV/TXT of RR intervals (ms)
                                    </span>
                                    <Input
                                        id="file"
                                        type="file"
                                        className="hidden"
                                        accept=".txt,.csv"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={!file || isLoading}>
                                {isLoading ? 'Processing...' : 'Upload & Analyze'}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
