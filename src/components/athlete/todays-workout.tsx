'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar, TrendingUp, Activity } from 'lucide-react';
import { MesocycleWorkout } from '@/lib/periodization/types';
import { downloadWorkout } from '@/lib/workouts/workout-export';

interface TodaysWorkoutProps {
    workout: MesocycleWorkout | null;
    ftp: number;
    athleteId: string;
}

export function TodaysWorkout({ workout, ftp, athleteId }: TodaysWorkoutProps) {
    if (!workout) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Workout di Oggi</CardTitle>
                    <CardDescription>Nessun workout programmato per oggi</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Goditi il giorno di riposo o contatta il tuo coach per programmare un allenamento.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const handleDownload = (format: 'zwo' | 'mrc' | 'erg' | 'json') => {
        // Use server-side download for better compatibility
        if (format === 'json') {
            downloadWorkout(workout, format, ftp); // Keep client-side for JSON if needed, or move to API too
            return;
        }

        // workout.id now contains the assignmentId thanks to the change in storage.ts
        const url = `/api/download-workout?assignmentId=${workout.id}&ftp=${ftp}&format=${format}&athleteId=${athleteId}`;
        window.location.href = url;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>{workout.name}</CardTitle>
                        <CardDescription>{workout.description}</CardDescription>
                    </div>
                    <Badge className="capitalize">{workout.type}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Workout Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Durata</p>
                        <p className="text-2xl font-bold">{workout.duration} min</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">TSS</p>
                        <p className="text-2xl font-bold">{workout.tss}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Intervalli</p>
                        <p className="text-2xl font-bold">{workout.intervals.length}</p>
                    </div>
                </div>

                {/* Intervals */}
                <div>
                    <h4 className="font-semibold mb-3">Struttura Workout</h4>
                    <div className="space-y-2">
                        {workout.intervals.map((interval, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border">
                                <Badge variant="outline" className="capitalize">
                                    {interval.type}
                                </Badge>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{interval.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {Math.floor(interval.duration / 60)} min
                                        {interval.power && ` • ${interval.power.min}-${interval.power.max}W (${Math.round(interval.power.min / ftp * 100)}-${Math.round(interval.power.max / ftp * 100)}% FTP)`}
                                        {interval.cadence && ` • ${interval.cadence.target} rpm`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coach Notes */}
                {workout.coachNotes && (
                    <div className="p-4 rounded-lg bg-muted">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Note del Coach
                        </h4>
                        <p className="text-sm text-muted-foreground">{workout.coachNotes}</p>
                    </div>
                )}

                {/* Download Buttons */}
                <div>
                    <h4 className="font-semibold mb-3">Scarica Workout</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleDownload('zwo')}
                            className="w-full"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Zwift (.zwo)
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleDownload('mrc')}
                            className="w-full"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            TrainerRoad (.mrc)
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleDownload('erg')}
                            className="w-full"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Generico (.erg)
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleDownload('json')}
                            className="w-full"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            JSON (.json)
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
