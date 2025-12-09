'use client';

import { CalendarView, CalendarEvent } from './calendar-view';
import { WorkoutLibrarySidebar } from './workout-library-sidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { Download, Trash2, Loader2, Wand2, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { deleteWorkoutAssignment, assignWorkout } from '@/app/actions/workout-management';
import { checkScheduleHealth, applyScheduleFix, ScheduleHealthResult, ScheduleSuggestion } from '@/app/actions/schedule-intelligence';
import { useToast } from "@/components/ui/use-toast";

interface CalendarPageClientProps {
    events: CalendarEvent[];
    athleteFtp: number;
    athleteId: string;
    isCoach?: boolean; // Defaults to true if not specified
}

export function CalendarPageClient({ events, athleteFtp, athleteId, isCoach = true }: CalendarPageClientProps) {
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [healthResult, setHealthResult] = useState<ScheduleHealthResult | null>(null);
    const [showSmartDialog, setShowSmartDialog] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isCoach) {
            checkScheduleHealth(athleteId).then(setHealthResult);
        }
    }, [athleteId, events, isCoach]);

    const handleDownload = (format: string) => {
        if (!selectedEvent) return;
        const url = `/api/download-workout?assignmentId=${selectedEvent.id}&ftp=${athleteFtp}&format=${format}&athleteId=${athleteId}`;
        window.location.href = url;
    };

    const handleDelete = async (event: CalendarEvent) => {
        if (!isCoach) return;
        const confirmDelete = window.confirm(`Sei sicuro di voler eliminare "${event.title}"?`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteWorkoutAssignment(athleteId, event.id);
            if (result.success) {
                toast({
                    title: "Workout eliminato",
                    description: "L'assegnazione è stata rimossa con successo.",
                });
                if (selectedEvent?.id === event.id) {
                    setSelectedEvent(null);
                }
                if (isCoach) checkScheduleHealth(athleteId).then(setHealthResult);
            } else {
                toast({
                    title: "Errore",
                    description: result.error || "Impossibile eliminare il workout.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Errore",
                description: "Si è verificato un errore durante l'eliminazione.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleWorkoutDrop = async (dateStr: string, workoutId: string) => {
        if (!isCoach) return;
        try {
            const result = await assignWorkout(athleteId, workoutId, dateStr);
            if (result.success) {
                toast({
                    title: "Workout assegnato",
                    description: `Allenamento assegnato correttamente per il giorno ${dateStr}.`,
                });
            } else {
                toast({
                    title: "Errore",
                    description: result.error || "Impossibile assegnare il workout.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Errore",
                description: "Si è verificato un errore durante l'assegnazione.",
                variant: "destructive",
            });
        }
    };

    const handleApplyFix = async (suggestion: ScheduleSuggestion) => {
        const res = await applyScheduleFix(athleteId, suggestion);
        if (res.success) {
            toast({ title: "Modifica applicata", description: "Il piano è stato aggiornato." });
            setHealthResult(prev => prev ? {
                ...prev,
                suggestions: prev.suggestions.filter(s => s.id !== suggestion.id)
            } : null);
            if (healthResult?.suggestions.length === 1) setShowSmartDialog(false);
        } else {
            toast({ title: "Errore", description: "Impossibile applicare la modifica.", variant: "destructive" });
        }
    };

    return (
        <div className="flex flex-col gap-4 h-[calc(100vh-150px)] min-h-[600px]">
            {/* Coach Toolbar */}
            {isCoach && (
                <div className="flex justify-between items-center bg-muted/20 p-2 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wand2 className="h-4 w-4" />
                        <span>AI Coach Assistant</span>
                    </div>
                    <Button
                        size="sm"
                        variant={healthResult?.status === 'ISSUES' ? "default" : "secondary"}
                        onClick={() => setShowSmartDialog(true)}
                        className="gap-2"
                    >
                        {healthResult?.status === 'ISSUES' && <AlertTriangle className="h-3 w-3" />}
                        Ottimizza Settimana
                    </Button>
                </div>
            )}

            {/* Smart Assistant Alert (Only if urgent issues and not already showing dialog) */}
            {isCoach && healthResult?.status === 'ISSUES' && !showSmartDialog && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-full">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">Attenzione Richiesta</h4>
                            <p className="text-xs text-amber-700 dark:text-amber-300">Ci sono {healthResult.suggestions.length} workout non completati che richiedono azione.</p>
                        </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-amber-300 hover:bg-amber-100 text-amber-900" onClick={() => setShowSmartDialog(true)}>
                        Risolvi Ora
                    </Button>
                </div>
            )}

            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Sidebar - Coach Only */}
                {isCoach && (
                    <div className="w-64 shrink-0 h-full border rounded-xl bg-card overflow-hidden">
                        <WorkoutLibrarySidebar />
                    </div>
                )}

                {/* Calendar - Full width if no sidebar */}
                <div className="flex-1 min-w-0 h-full">
                    <CalendarView
                        events={events}
                        onEventClick={(event) => setSelectedEvent(event)}
                        onDeleteEvent={isCoach ? handleDelete : undefined}
                        onWorkoutDrop={isCoach ? handleWorkoutDrop : undefined}
                    />
                </div>
            </div>

            {/* Smart Assistant Dialog */}
            <Dialog open={showSmartDialog} onOpenChange={setShowSmartDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wand2 className="h-5 w-5 text-primary" />
                            Ottimizzazione Piano
                        </DialogTitle>
                        <DialogDescription>
                            Ho analizzato lo storico e trovato alcune incoerenze. Ecco cosa suggerisco:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {healthResult?.suggestions.map(suggestion => (
                            <div key={suggestion.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                <div className="flex items-center gap-3">
                                    {suggestion.type === 'DELETE' ? (
                                        <div className="bg-rose-100 p-2 rounded text-rose-600">
                                            <Trash2 className="h-4 w-4" />
                                        </div>
                                    ) : (
                                        <div className="bg-blue-100 p-2 rounded text-blue-600">
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    )}
                                    <span className="text-sm font-medium">{suggestion.description}</span>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => handleApplyFix(suggestion)}>
                                    Applica
                                </Button>
                            </div>
                        ))}
                        {healthResult?.suggestions.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                <p>Tutto risolto!</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSmartDialog(false)}>Chiudi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Event Details Dialog (Existing) */}
            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedEvent?.title}</DialogTitle>
                        <DialogDescription>
                            {selectedEvent?.date} • {selectedEvent?.status || 'PENDING'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <p className="text-sm text-muted-foreground mb-4">
                            {selectedEvent?.description || 'Nessuna descrizione disponibile.'}
                        </p>

                        {selectedEvent?.details && selectedEvent.details.steps && (
                            <div className="bg-muted/30 p-3 rounded-md border text-sm">
                                <h4 className="font-semibold mb-2">Struttura Workout</h4>
                                <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2">
                                    {selectedEvent.details.steps.map((step: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center py-1 border-b border-muted/50 last:border-0">
                                            <span className="font-medium text-xs uppercase bg-primary/10 px-1.5 py-0.5 rounded text-primary">
                                                {step.type}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {Math.round(step.duration / 60)}m @ {Math.round(step.power * 100)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                        <div className="flex gap-2">
                            {selectedEvent?.type === 'WORKOUT' && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload('zwo')}
                                    >
                                        <Download className="mr-2 h-3 w-3" /> ZWO
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload('erg')}
                                    >
                                        <Download className="mr-2 h-3 w-3" /> ERG
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownload('mrc')}
                                    >
                                        <Download className="mr-2 h-3 w-3" /> MRC
                                    </Button>
                                </>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {isCoach && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={isDeleting}
                                    onClick={() => selectedEvent && handleDelete(selectedEvent)}
                                >
                                    {isDeleting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Trash2 className="h-3 w-3 mr-2" />}
                                    Elimina
                                </Button>
                            )}
                            <Button variant="secondary" onClick={() => setSelectedEvent(null)}>Chiudi</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
