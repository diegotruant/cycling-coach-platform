'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { WorkoutGenerationParams, GeneratedWorkout } from '@/lib/ai/types';

interface CreateWorkoutDialogProps {
    trigger?: React.ReactNode;
    onWorkoutCreated?: (workout: GeneratedWorkout) => void;
}

export function CreateWorkoutDialog({ trigger, onWorkoutCreated }: CreateWorkoutDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);

    const [params, setParams] = useState<Partial<WorkoutGenerationParams>>({
        athleteProfile: {
            ftp: 250,
            maxHR: 185,
            experience: 'intermedio',
            goals: []
        },
        workoutType: 'soglia',
        duration: 60,
    });

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/ai/generate-workout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Errore nella generazione del workout');
            }

            setGeneratedWorkout(data);
        } catch (error) {
            console.error('Errore:', error);
            const errorMessage = error instanceof Error ? error.message : 'Errore nella generazione del workout';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (generatedWorkout && onWorkoutCreated) {
            onWorkoutCreated(generatedWorkout);
            setOpen(false);
            setGeneratedWorkout(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Crea con AI
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Genera Workout con AI</DialogTitle>
                    <DialogDescription>
                        Usa l&apos;intelligenza artificiale per creare workout personalizzati
                    </DialogDescription>
                </DialogHeader>

                {!generatedWorkout ? (
                    <div className="space-y-4">
                        {/* Profilo Atleta */}
                        <div className="space-y-3">
                            <h3 className="font-semibold">Profilo Atleta</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>FTP (Watt)</Label>
                                    <Input
                                        type="number"
                                        value={params.athleteProfile?.ftp}
                                        onChange={(e) => setParams({
                                            ...params,
                                            athleteProfile: {
                                                ...params.athleteProfile!,
                                                ftp: parseInt(e.target.value)
                                            }
                                        })}
                                    />
                                </div>
                                <div>
                                    <Label>FC Max (bpm)</Label>
                                    <Input
                                        type="number"
                                        value={params.athleteProfile?.maxHR || ''}
                                        onChange={(e) => setParams({
                                            ...params,
                                            athleteProfile: {
                                                ...params.athleteProfile!,
                                                maxHR: parseInt(e.target.value)
                                            }
                                        })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Livello Esperienza</Label>
                                <Select
                                    value={params.athleteProfile?.experience}
                                    onValueChange={(value: any) => setParams({
                                        ...params,
                                        athleteProfile: {
                                            ...params.athleteProfile!,
                                            experience: value
                                        }
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="principiante">Principiante</SelectItem>
                                        <SelectItem value="intermedio">Intermedio</SelectItem>
                                        <SelectItem value="avanzato">Avanzato</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Parametri Workout */}
                        <div className="space-y-3">
                            <h3 className="font-semibold">Parametri Workout</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Tipo Workout</Label>
                                    <Select
                                        value={params.workoutType}
                                        onValueChange={(value: any) => setParams({ ...params, workoutType: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="endurance">Endurance</SelectItem>
                                            <SelectItem value="soglia">Soglia</SelectItem>
                                            <SelectItem value="vo2max">VO2 Max</SelectItem>
                                            <SelectItem value="recupero">Recupero</SelectItem>
                                            <SelectItem value="sprint">Sprint</SelectItem>
                                            <SelectItem value="personalizzato">Personalizzato</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Durata (minuti)</Label>
                                    <Input
                                        type="number"
                                        value={params.duration}
                                        onChange={(e) => setParams({ ...params, duration: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>TSS Target (opzionale)</Label>
                                <Input
                                    type="number"
                                    placeholder="Es. 95"
                                    value={params.targetTSS || ''}
                                    onChange={(e) => setParams({ ...params, targetTSS: parseInt(e.target.value) || undefined })}
                                />
                            </div>
                            <div>
                                <Label>Istruzioni Specifiche (opzionale)</Label>
                                <Textarea
                                    placeholder="Es. 2 blocchi da 20 minuti alla soglia con 5 minuti di recupero"
                                    value={params.specificInstructions || ''}
                                    onChange={(e) => setParams({ ...params, specificInstructions: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generazione in corso...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Genera Workout
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Preview Workout Generato */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{generatedWorkout.name}</CardTitle>
                                        <CardDescription>{generatedWorkout.description}</CardDescription>
                                    </div>
                                    <Badge>{generatedWorkout.difficulty}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Durata</p>
                                        <p className="font-semibold">{generatedWorkout.duration} min</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">TSS</p>
                                        <p className="font-semibold">{generatedWorkout.tss}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Intervalli</p>
                                        <p className="font-semibold">{generatedWorkout.intervals.length}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Struttura Workout</h4>
                                    <div className="space-y-2">
                                        {generatedWorkout.intervals.map((interval, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-2 rounded border">
                                                <Badge variant="outline" className="capitalize">
                                                    {interval.type}
                                                </Badge>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{interval.description}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {Math.floor(interval.duration / 60)} min
                                                        {interval.power && ` • ${interval.power.min}-${interval.power.max}W`}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {generatedWorkout.coachingNotes && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Note del Coach</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {generatedWorkout.coachingNotes}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setGeneratedWorkout(null)} className="flex-1">
                                Rigenera
                            </Button>
                            <Button onClick={handleSave} className="flex-1">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Salva Workout
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
