'use client';

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

// Types
export interface CoachScheduleEvent {
    id: string;
    athleteId: string;
    athleteName: string;
    date: string; // YYYY-MM-DD
    title: string;
    status?: 'PENDING' | 'COMPLETED' | 'SKIPPED';
    description?: string;
}

interface CoachScheduleClientProps {
    events: CoachScheduleEvent[];
}

const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export function CoachScheduleClient({ events }: CoachScheduleClientProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Helper to get monday of the current week
    const getMonday = (d: Date) => {
        d = new Date(d);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    };

    const startOfWeek = getMonday(currentDate);

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    // Helper to get events for a specific date
    const getEventsForDate = (dateStr: string) => {
        return events.filter(e => e.date === dateStr);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Calendario Allenamenti</h1>
                    <p className="text-muted-foreground mt-2">
                        Visualizza e gestisci gli allenamenti programmati per tutti gli atleti
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Assegna Workout
                </Button>
            </div>

            {/* Calendar Controls */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <CardTitle className="capitalize">
                            {startOfWeek.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                        </CardTitle>
                        <Button variant="outline" size="icon" onClick={handleNextWeek}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Week View */}
                    <div className="grid grid-cols-7 gap-2">
                        {weekDays.map((day) => (
                            <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
                                {day}
                            </div>
                        ))}

                        {/* Calendar Days */}
                        {Array.from({ length: 7 }, (_, i) => {
                            const dayDate = new Date(startOfWeek);
                            dayDate.setDate(startOfWeek.getDate() + i);
                            const dayStr = dayDate.toISOString().split('T')[0];
                            const isToday = dayDate.toDateString() === new Date().toDateString();
                            const dailyEvents = getEventsForDate(dayStr);

                            return (
                                <div
                                    key={i}
                                    className={`min-h-[120px] border rounded-lg p-2 transition-colors cursor-pointer flex flex-col gap-1 ${isToday ? 'bg-primary/5 border-primary' : 'hover:bg-accent/50'}`}
                                >
                                    <div className="text-sm font-semibold mb-1 flex justify-between">
                                        <span>{dayDate.getDate()}</span>
                                    </div>
                                    {/* Workouts for this day */}
                                    <div className="space-y-1 overflow-y-auto max-h-[150px]">
                                        {dailyEvents.map((event) => (
                                            <div
                                                key={event.id}
                                                className={`text-xs rounded p-1.5 truncate border ${event.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        event.status === 'SKIPPED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                            'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}
                                                title={`${event.title} - ${event.athleteName}`}
                                            >
                                                <b>{event.athleteName.split(' ')[0]}</b>: {event.title}
                                            </div>
                                        ))}
                                        {dailyEvents.length === 0 && (
                                            <div className="text-xs text-muted-foreground italic p-1">Nessun evento</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Workouts List */}
            <Card>
                <CardHeader>
                    <CardTitle>Dettaglio Settimana</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 7 }, (_, i) => {
                            const dayDate = new Date(startOfWeek);
                            dayDate.setDate(startOfWeek.getDate() + i);
                            const dayStr = dayDate.toISOString().split('T')[0];
                            const dailyEvents = getEventsForDate(dayStr);

                            if (dailyEvents.length === 0) return null;

                            return dailyEvents.map(event => (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center justify-center w-10 h-10 bg-muted rounded-md shrink-0">
                                            <span className="text-xs font-bold uppercase">{dayDate.toLocaleDateString('it-IT', { weekday: 'short' })}</span>
                                            <span className="text-xs">{dayDate.getDate()}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium">{event.athleteName}</p>
                                            <p className="text-sm text-muted-foreground">{event.title}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={event.status === "COMPLETED" ? "default" : "outline"}>
                                            {event.status || 'PENDING'}
                                        </Badge>
                                    </div>
                                </div>
                            ));
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
