'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Zap, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { WorkoutTemplate } from "@/core/workouts/library";

interface DailyPlanCardProps {
    workout: WorkoutTemplate | null;
    modificationReason?: string | null;
    athleteFtp?: number;
}

export function DailyPlanCard({ workout, modificationReason, athleteFtp = 200 }: DailyPlanCardProps) {
    if (!workout) {
        return (
            <Card className="h-full border-dashed">
                <CardContent className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground">
                    <Calendar className="h-10 w-10 mb-4 opacity-50" />
                    <p>Nessun allenamento programmato per oggi.</p>
                    <p className="text-sm">Goditi il giorno di riposo!</p>
                </CardContent>
            </Card>
        );
    }

    const isModified = !!modificationReason;
    const isRecovery = workout.type === 'RECOVERY';

    return (
        <Card className={`h-full border-l-4 ${isRecovery ? 'border-l-green-500' : isModified ? 'border-l-yellow-500' : 'border-l-primary'}`}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            {workout.name}
                            {isModified && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-500 bg-yellow-500/10">
                                    Adattato
                                </Badge>
                            )}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {calculateDuration(workout)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {workout.type}
                            </span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isModified && (
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>{modificationReason}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{workout.description}</p>

                    <div className="space-y-1">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Struttura</h4>
                        <div className="text-sm space-y-1 max-h-[150px] overflow-y-auto pr-2">
                            {workout.intervals.map((interval, idx) => (
                                <div key={idx} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                                    <span className={`font-medium ${interval.type === 'WORK' ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {interval.type}
                                    </span>
                                    <span className="text-muted-foreground">{interval.duration} @ {interval.intensity}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-2 gap-2">
                <button
                    onClick={() => {
                        const url = `/api/download-workout?testId=${workout.id}&ftp=${athleteFtp}&format=zwo`;
                        window.location.href = url;
                    }}
                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Scarica ZWO
                </button>
            </CardFooter>
        </Card>
    );
}

function calculateDuration(workout: WorkoutTemplate): string {
    // Very rough estimation parsing strings like "3min", "60s"
    // For display only
    let totalMinutes = 0;
    for (const i of workout.intervals) {
        if (i.duration.includes('min')) {
            totalMinutes += parseInt(i.duration) || 0;
        } else if (i.duration.includes('s')) {
            totalMinutes += (parseInt(i.duration) || 0) / 60;
        }
    }
    return `${Math.round(totalMinutes)} min`;
}
