'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignWorkout, checkHRVForDate } from '@/app/actions/workout-assignment';
import { TEST_PROTOCOLS } from '@/lib/workouts/protocols';
import { WORKOUT_LIBRARY } from '@/lib/workouts/library';
import { CalendarIcon, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIGeneratorForm } from "@/components/workouts/ai-generator-form";

interface AssignWorkoutDialogProps {
    athleteId: string;
    athleteName: string;
}

export default function AssignWorkoutDialog({ athleteId, athleteName }: AssignWorkoutDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default today
    const [workoutId, setWorkoutId] = useState('');
    const [notes, setNotes] = useState('');
    const [hrvWarning, setHrvWarning] = useState<{ status: string, reason?: string } | null>(null);
    const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
    const { toast } = useToast();

    const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setDate(newDate);

        // Check HRV if date is today
        const check = await checkHRVForDate(athleteId, newDate);
        if (check.status !== 'OK' && check.status !== 'NO_DATA') {
            setHrvWarning(check);
        } else {
            setHrvWarning(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let finalWorkoutId = workoutId;
        let finalStructure = undefined;

        if (generatedWorkout) {
            finalWorkoutId = 'ai-' + Date.now();
            finalStructure = generatedWorkout;
        }

        const result = await assignWorkout(athleteId, finalWorkoutId, date, notes, finalStructure);

        setLoading(false);
        if (result.success) {
            toast({
                title: "Workout assegnato",
                description: `Assegnato ${result.assignment?.workoutName} a ${athleteName} per il ${date}`,
            });
            setOpen(false);
            setWorkoutId('');
            setNotes('');
        } else {
            toast({
                title: "Errore",
                description: "Impossibile assegnare il workout",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Assegna Workout</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assegna Workout</DialogTitle>
                    <DialogDescription>
                        Pianifica un allenamento per {athleteName}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="date">Data</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={handleDateChange}
                            required
                        />
                    </div>

                    {hrvWarning && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-sm text-red-600">
                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                            <div>
                                <strong>Attenzione HRV:</strong>
                                {hrvWarning.reason === 'NFOR' && ' Possibile Non-Functional Overreaching detected.'}
                                {hrvWarning.reason === 'RED_HRV' && ' HRV Status è ROSSO oggi.'}
                                <br />Si sconsiglia alta intensità.
                            </div>
                        </div>
                    )}

                    <Tabs defaultValue="library" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="library">Library</TabsTrigger>
                            <TabsTrigger value="ai">AI Generator</TabsTrigger>
                        </TabsList>

                        <TabsContent value="library">
                            <div className="grid gap-2">
                                <Label htmlFor="workout">Protocollo / Workout</Label>


                                <select
                                    id="workout"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={workoutId}
                                    onChange={(e) => { setWorkoutId(e.target.value); setGeneratedWorkout(null); }}
                                >
                                    <option value="">Seleziona un workout...</option>
                                    {Object.entries(WORKOUT_LIBRARY).map(([category, workouts]) => (
                                        <optgroup key={category} label={category}>
                                            {workouts.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                        </TabsContent>

                        <TabsContent value="ai">
                            {!generatedWorkout ? (
                                <AIGeneratorForm ftp={250} onWorkoutGenerated={setGeneratedWorkout} />
                            ) : (
                                <div className="space-y-4 border p-4 rounded bg-green-50/50">
                                    <div>
                                        <h4 className="font-bold text-green-900">{generatedWorkout.name}</h4>
                                        <p className="text-sm text-green-800">{generatedWorkout.description}</p>
                                        {generatedWorkout.citations && generatedWorkout.citations.length > 0 && (
                                            <div className="mt-2 text-xs text-green-700 italic">
                                                <strong>Riferimenti:</strong>
                                                <ul className="list-disc list-inside">
                                                    {generatedWorkout.citations.map((cit: string, idx: number) => (
                                                        <li key={idx}>{cit}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <div className="max-h-40 overflow-y-auto text-xs border-t border-green-200 pt-2">
                                        {generatedWorkout.steps.map((s: any, i: number) => (
                                            <div key={i} className="flex justify-between py-1">
                                                <span className="font-medium">{s.type}</span>
                                                <span>{Math.round(s.duration / 60)}m @ {Math.round(s.power * 100)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => setGeneratedWorkout(null)}>Regenerate</Button>
                                        <div className="text-xs text-muted-foreground flex items-center ml-auto">
                                            Ready to assign
                                        </div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Note per l&apos;atleta</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Es: Riscaldamento lungo, focus su cadenza..."
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading || (!workoutId && !generatedWorkout)}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Assegnazione...
                                </>
                            ) : (
                                'Conferma Assegnazione'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
