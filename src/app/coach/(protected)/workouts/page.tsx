'use client';

import { useState, useMemo } from 'react';
import { Dumbbell, Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CreateWorkoutDialog } from "@/components/workouts/create-workout-dialog";
import { WORKOUT_LIBRARY, WorkoutTemplate } from "@/lib/workout-library";

const workoutTypes = ["All", "RECOVERY", "ENDURANCE", "TEMPO", "THRESHOLD", "VO2MAX", "ANAEROBIC", "SPRINT"];
const difficulties = ["All", "BEGINNER", "INTERMEDIATE", "ADVANCED", "ELITE"];

export default function WorkoutsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("All");
    const [selectedDifficulty, setSelectedDifficulty] = useState("All");
    const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null);

    const filteredWorkouts = useMemo(() => {
        return WORKOUT_LIBRARY.filter(workout => {
            const matchesSearch = workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                workout.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = selectedType === "All" || workout.category === selectedType;
            const matchesDifficulty = selectedDifficulty === "All" || workout.difficulty === selectedDifficulty;
            return matchesSearch && matchesType && matchesDifficulty;
        });
    }, [searchQuery, selectedType, selectedDifficulty]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Libreria Workout</h1>
                    <p className="text-muted-foreground mt-2">
                        Protocolli evidence-based e workout personalizzati
                    </p>
                </div>
                <CreateWorkoutDialog
                    onWorkoutCreated={(workout) => {
                        console.log('Workout creato:', workout);
                        // TODO: Salvare workout nella libreria custom
                    }}
                />
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Cerca per nome o descrizione..."
                                    className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                            >
                                {workoutTypes.map(type => (
                                    <option key={type} value={type}>{type === "All" ? "Tutti i Tipi" : type}</option>
                                ))}
                            </select>
                            <select
                                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedDifficulty}
                                onChange={(e) => setSelectedDifficulty(e.target.value)}
                            >
                                {difficulties.map(diff => (
                                    <option key={diff} value={diff}>{diff === "All" ? "Tutte le Difficoltà" : diff}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Workouts Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredWorkouts.map((workout) => (
                    <Card key={workout.id} className="hover:shadow-md transition-shadow cursor-pointer flex flex-col">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <Dumbbell className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-lg line-clamp-1" title={workout.name}>{workout.name}</CardTitle>
                                </div>
                                <Badge variant={workout.difficulty === 'ELITE' ? 'destructive' : 'outline'}>
                                    {workout.category}
                                </Badge>
                            </div>
                            <CardDescription className="line-clamp-2" title={workout.description}>
                                {workout.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                                <div>
                                    <p className="text-muted-foreground">Durata</p>
                                    <p className="font-semibold">{workout.duration} min</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">TSS</p>
                                    <p className="font-semibold">{workout.tss}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Livello</p>
                                    <p className="font-semibold text-xs">{workout.difficulty}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                                {workout.tags.slice(0, 3).map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                        {tag}
                                    </Badge>
                                ))}
                                {workout.tags.length > 3 && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">+{workout.tags.length - 3}</Badge>
                                )}
                            </div>

                            {workout.evidenceBasedRef && (
                                <div className="flex items-start gap-1 text-xs text-muted-foreground bg-muted/50 p-2 rounded mt-2">
                                    <BookOpen className="h-3 w-3 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2" title={workout.evidenceBasedRef}>
                                        {workout.evidenceBasedRef}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex gap-2 pt-0">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedWorkout(workout)}>
                                Dettagli
                            </Button>
                            <Button size="sm" className="flex-1">
                                Assegna
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Details Dialog */}
            <Dialog open={!!selectedWorkout} onOpenChange={() => setSelectedWorkout(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedWorkout?.name}</DialogTitle>
                        <DialogDescription>{selectedWorkout?.description}</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                        {selectedWorkout?.steps.map((step, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm border-b pb-1">
                                <span className="font-medium capitalize">{step.type}</span>
                                <span>{step.duration}s</span>
                                <span>
                                    {step.targetType === 'percent_ftp' && typeof step.targetValue === 'number'
                                        ? `${step.targetValue}% FTP`
                                        : Array.isArray(step.targetValue)
                                            ? `${step.targetValue[0]}-${step.targetValue[1]}% FTP`
                                            : step.targetValue}
                                </span>
                                {step.description && <span className="text-muted-foreground">{step.description}</span>}
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setSelectedWorkout(null)}>Chiudi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Empty State */}
            {filteredWorkouts.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nessun workout trovato</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Prova a modificare i filtri di ricerca
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
