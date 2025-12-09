'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, CheckCircle2, Circle } from 'lucide-react';
import { Mesocycle } from '@/lib/periodization/types';

interface MesocycleProgressProps {
    mesocycle: Mesocycle | null;
}

export function MesocycleProgress({ mesocycle }: MesocycleProgressProps) {
    if (!mesocycle) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Mesociclo Attuale</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Nessun mesociclo attivo. Il tuo coach programmerà presto il tuo piano di allenamento.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const currentWeek = 1; // TODO: Calculate from dates
    const progress = (currentWeek / mesocycle.weeks) * 100;
    const completedWorkouts = mesocycle.actualProgress?.completedWorkouts || 0;
    const totalWorkouts = mesocycle.actualProgress?.totalWorkouts || mesocycle.weeklyStructure.reduce((sum, w) => sum + w.workouts.length, 0);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>{mesocycle.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {mesocycle.protocol.name}
                        </p>
                    </div>
                    <Badge>{mesocycle.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Settimana {currentWeek} di {mesocycle.weeks}</span>
                        <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} />
                </div>

                {/* Completion Rate */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Workout Completati</span>
                    </div>
                    <span className="text-sm font-bold">{completedWorkouts}/{totalWorkouts}</span>
                </div>

                {/* Objectives */}
                <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Obiettivi Mesociclo
                    </h4>
                    <ul className="space-y-1">
                        {mesocycle.protocol.expectedAdaptations.slice(0, 3).map((adaptation, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <Circle className="h-3 w-3 mt-1 flex-shrink-0" />
                                <span>{adaptation}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{mesocycle.startDate} - {mesocycle.endDate}</span>
                </div>
            </CardContent>
        </Card>
    );
}
