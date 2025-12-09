'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Circle, Dumbbell, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export interface CalendarEvent {
    id: string;
    date: string; // YYYY-MM-DD
    title: string;
    type: 'WORKOUT' | 'NOTE' | 'RACE';
    status?: 'PENDING' | 'COMPLETED' | 'SKIPPED';
    description?: string;
    details?: any; // For structured workouts or extra data
}

interface CalendarViewProps {
    events: CalendarEvent[];
    onDateClick?: (date: string) => void;
    onEventClick?: (event: CalendarEvent) => void;
    onDeleteEvent?: (event: CalendarEvent) => void;
    onWorkoutDrop?: (date: string, workoutId: string) => void;
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export function CalendarView({ events, onDateClick, onEventClick, onDeleteEvent, onWorkoutDrop }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [dragOverDate, setDragOverDate] = useState<string | null>(null);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust for Monday start (0=Mon, 6=Sun)
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);

    const days = [];

    // Previous month filler
    for (let i = 0; i < firstDay; i++) {
        days.push({
            date: new Date(year, month - 1, prevMonthDays - firstDay + 1 + i),
            isCurrentMonth: false
        });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({
            date: new Date(year, month, i),
            isCurrentMonth: true
        });
    }

    // Next month filler
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
        days.push({
            date: new Date(year, month + 1, i),
            isCurrentMonth: false
        });
    }

    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
    };

    const handleToday = () => setCurrentDate(new Date());

    const formatDate = (date: Date) => {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');
    };

    const getEventsForDate = (date: Date) => {
        const dateStr = formatDate(date);
        return events.filter(e => e.date === dateStr);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, dateStr: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (dragOverDate !== dateStr) {
            setDragOverDate(dateStr);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dateStr: string) => {
        e.preventDefault();
        setDragOverDate(null);
        const workoutId = e.dataTransfer.getData('workoutId');
        if (workoutId && onWorkoutDrop) {
            onWorkoutDrop(dateStr, workoutId);
        }
    };

    return (
        <div className="flex flex-col h-full bg-card rounded-xl border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-card">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <CalendarIcon className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold capitalize">
                        {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                    </h2>
                    <Button variant="outline" size="sm" onClick={handleToday} className="ml-2">Oggi</Button>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b bg-muted/30">
                {DAYS.map(day => (
                    <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div
                className="grid grid-cols-7 flex-1 auto-rows-fr bg-muted/5"
                onMouseLeave={() => setDragOverDate(null)}
            >
                {days.map((day, idx) => {
                    const dayEvents = getEventsForDate(day.date);
                    const dateStr = formatDate(day.date);
                    const todayClass = isToday(day.date) ? 'bg-primary/5 font-bold' : 'bg-card';
                    const otherMonthClass = !day.isCurrentMonth ? 'text-muted-foreground opacity-50 bg-muted/10' : '';
                    const isDragOver = dragOverDate === dateStr;

                    return (
                        <div
                            key={idx}
                            className={cn(
                                "min-h-[120px] p-2 border-b border-r relative group transition-colors flex flex-col gap-1",
                                todayClass,
                                otherMonthClass,
                                isDragOver ? "bg-primary/20 ring-2 ring-primary ring-inset z-10" : "hover:bg-muted/30",
                                idx % 7 === 6 && "border-r-0"
                            )}
                            onClick={() => onDateClick?.(dateStr)}
                            onDragOver={(e) => handleDragOver(e, dateStr)}
                            onDrop={(e) => handleDrop(e, dateStr)}
                        >
                            <div className="flex justify-between items-start pointer-events-none">
                                <span className={cn(
                                    "text-sm h-7 w-7 flex items-center justify-center rounded-full mb-1",
                                    isToday(day.date) ? "bg-primary text-primary-foreground font-bold shadow-sm" : "text-muted-foreground"
                                )}>
                                    {day.date.getDate()}
                                </span>
                            </div>

                            <div className="space-y-1 flex-1">
                                {dayEvents.map(event => (
                                    <div
                                        key={event.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick?.(event);
                                        }}
                                        className={cn(
                                            "text-xs px-2 py-1.5 rounded-md truncate cursor-pointer flex items-center gap-1.5 shadow-sm border transition-all hover:scale-[1.02] hover:shadow-md group/event pr-6 relative",
                                            event.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' :
                                                event.status === 'SKIPPED' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' :
                                                    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                        )}
                                        title={event.title}
                                    >
                                        {event.status === 'COMPLETED' ? <Check className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" /> :
                                            event.status === 'SKIPPED' ? <X className="h-3 w-3 shrink-0 text-rose-600 dark:text-rose-400" /> :
                                                <Circle className="h-2 w-2 shrink-0 fill-current text-blue-500" />}
                                        <span className="truncate font-medium">{event.title}</span>

                                        {/* Delete Button - Visible on Hover */}
                                        {onDeleteEvent && (
                                            <div
                                                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/event:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteEvent(event);
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3 text-current opacity-70 hover:opacity-100" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
