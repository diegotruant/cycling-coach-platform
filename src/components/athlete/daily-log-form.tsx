'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Activity, Moon, Battery, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DailyLogForm() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        hrv: '',
        hrr: '',
        sleepQuality: 7,
        sleepDuration: 7.5,
        fatigue: 3,
        stress: 3,
        soreness: 2,
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Calculate traffic light based on simple logic (mock)
            // In production this would compare to baseline
            const hrvValue = parseInt(formData.hrv);
            let trafficLight = 'GREEN';
            if (hrvValue < 40) trafficLight = 'RED';
            else if (hrvValue < 60) trafficLight = 'YELLOW';

            const response = await fetch('/api/athlete/log-daily', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    date: new Date().toISOString().split('T')[0],
                    trafficLight
                })
            });

            if (!response.ok) throw new Error('Failed to log data');

            router.push('/athlete');
            router.refresh();
        } catch (error) {
            console.error('Error logging daily data:', error);
            alert('Errore nel salvataggio dei dati.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Log Giornaliero</CardTitle>
                <CardDescription>Inserisci i tuoi dati fisiologici e soggettivi di oggi.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Physiological Metrics */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Fisiologia
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="hrv">HRV (rMSSD)</Label>
                                <Input
                                    id="hrv"
                                    type="number"
                                    placeholder="e.g. 65"
                                    required
                                    value={formData.hrv}
                                    onChange={e => setFormData({ ...formData, hrv: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hrr">Resting HR</Label>
                                <Input
                                    id="hrr"
                                    type="number"
                                    placeholder="e.g. 52"
                                    required
                                    value={formData.hrr}
                                    onChange={e => setFormData({ ...formData, hrr: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sleep */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Moon className="h-5 w-5" />
                            Sonno
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Qualità del Sonno (1-10)</Label>
                                    <span className="text-sm text-muted-foreground">{formData.sleepQuality}/10</span>
                                </div>
                                <Slider
                                    min={1}
                                    max={10}
                                    step={1}
                                    value={[formData.sleepQuality]}
                                    onValueChange={v => setFormData({ ...formData, sleepQuality: v[0] })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sleepDuration">Durata (ore)</Label>
                                <Input
                                    id="sleepDuration"
                                    type="number"
                                    step="0.5"
                                    value={formData.sleepDuration}
                                    onChange={e => setFormData({ ...formData, sleepDuration: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Subjective */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Battery className="h-5 w-5" />
                            Sensazioni
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Fatica (1-10)</Label>
                                    <span className="text-sm text-muted-foreground">{formData.fatigue}/10</span>
                                </div>
                                <Slider
                                    min={1}
                                    max={10}
                                    step={1}
                                    value={[formData.fatigue]}
                                    onValueChange={v => setFormData({ ...formData, fatigue: v[0] })}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Stress (1-10)</Label>
                                    <span className="text-sm text-muted-foreground">{formData.stress}/10</span>
                                </div>
                                <Slider
                                    min={1}
                                    max={10}
                                    step={1}
                                    value={[formData.stress]}
                                    onValueChange={v => setFormData({ ...formData, stress: v[0] })}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Dolori Muscolari (1-10)</Label>
                                    <span className="text-sm text-muted-foreground">{formData.soreness}/10</span>
                                </div>
                                <Slider
                                    min={1}
                                    max={10}
                                    step={1}
                                    value={[formData.soreness]}
                                    onValueChange={v => setFormData({ ...formData, soreness: v[0] })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Note (opzionale)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Come ti senti oggi?"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvataggio...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salva Log Giornaliero
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
