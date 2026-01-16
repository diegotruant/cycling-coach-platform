'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileIcon, Loader2 } from "lucide-react";

type WorkoutFile = {
    id: string;
    user_id: string;
    date: string;
    file_path: string;
};

export default function HistoryPage() {
    const [workouts, setWorkouts] = useState<WorkoutFile[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchWorkouts = async () => {
            const { data, error } = await supabase
                .from('workouts')
                .select('*')
                .order('date', { ascending: false });

            if (error) {
                console.error('Error fetching workouts:', error);
            } else {
                setWorkouts(data || []);
            }
            setLoading(false);
        };

        fetchWorkouts();
    }, []);

    const handleDownload = async (path: string) => {
        try {
            const { data, error } = await supabase.storage
                .from('workout-files')
                .createSignedUrl(path, 60);

            if (error) throw error;
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (e) {
            console.error('Error downloading file:', e);
            alert('Failed to download file');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Cronologia File .FIT</h1>

            <Card>
                <CardHeader>
                    <CardTitle>File Caricati</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : workouts.length === 0 ? (
                        <div className="text-center text-muted-foreground p-8">
                            Nessun file trovato.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium">
                                    <tr className="border-b">
                                        <th className="p-4">Data</th>
                                        <th className="p-4 hidden md:table-cell">Utente ID</th>
                                        <th className="p-4">File</th>
                                        <th className="p-4 text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workouts.map((workout) => (
                                        <tr key={workout.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="p-4 font-medium">
                                                {new Date(workout.date).toLocaleString('it-IT')}
                                            </td>
                                            <td className="p-4 text-muted-foreground font-mono text-xs hidden md:table-cell">
                                                {workout.user_id}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <FileIcon className="h-4 w-4 text-blue-500" />
                                                    <span className="truncate max-w-[150px] md:max-w-[300px]" title={workout.file_path}>
                                                        {workout.file_path.split('/').pop()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDownload(workout.file_path)}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Scarica
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
