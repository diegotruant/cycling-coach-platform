'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
import { Mesocycle } from '@/lib/periodization/types';

interface MesocycleApprovalDialogProps {
    mesocycle: Mesocycle | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApprove: (mesocycle: Mesocycle, notes?: string) => void;
    onRegenerate: () => void;
}

export function MesocycleApprovalDialog({
    mesocycle,
    open,
    onOpenChange,
    onApprove,
    onRegenerate
}: MesocycleApprovalDialogProps) {
    const [coachNotes, setCoachNotes] = useState('');
    const [approving, setApproving] = useState(false);

    if (!mesocycle) return null;

    const { analysis, protocol, weeklyStructure } = mesocycle;

    const handleApprove = async () => {
        setApproving(true);
        await onApprove(mesocycle, coachNotes);
        setApproving(false);
        onOpenChange(false);
    };

    // Helper to get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'green': return 'bg-green-500';
            case 'yellow': return 'bg-yellow-500';
            case 'red': return 'bg-red-500';
            case 'nfor': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Approva Mesociclo - {mesocycle.name}</DialogTitle>
                    <DialogDescription>
                        Rivedi l&apos;analisi dell&apos;atleta e il mesociclo generato dall&apos;AI
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Athlete Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Analisi Atleta
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* HRV Status */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">HRV Status</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`h-3 w-3 rounded-full ${getStatusColor(analysis.hrv.status)}`} />
                                        <span className="font-semibold uppercase">{analysis.hrv.status}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {analysis.hrv.current} ms (baseline: {analysis.hrv.baseline})
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Readiness Score</p>
                                    <p className="text-2xl font-bold mt-1">{analysis.readiness.score}/100</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Form Status</p>
                                    <Badge className="mt-1 capitalize">{analysis.pmc.formStatus}</Badge>
                                </div>
                            </div>

                            {/* PMC */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                <div>
                                    <p className="text-sm text-muted-foreground">CTL (Fitness)</p>
                                    <p className="text-xl font-semibold">{Math.round(analysis.pmc.ctl)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">ATL (Fatigue)</p>
                                    <p className="text-xl font-semibold">{Math.round(analysis.pmc.atl)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">TSB (Form)</p>
                                    <p className="text-xl font-semibold">{Math.round(analysis.pmc.tsb)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Protocol Recommendation */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Protocollo Consigliato</CardTitle>
                            <CardDescription>{protocol.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium mb-2">Rationale AI:</p>
                                <p className="text-sm text-muted-foreground">{protocol.rationale}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium mb-2">Adattamenti Attesi:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    {protocol.expectedAdaptations.map((adaptation, idx) => (
                                        <li key={idx} className="text-sm text-muted-foreground">
                                            {adaptation}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4" />
                                <span>Durata: {mesocycle.weeks} settimane</span>
                                <span className="text-muted-foreground">
                                    ({mesocycle.startDate} - {mesocycle.endDate})
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Weekly Structure Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Struttura Settimanale</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {weeklyStructure.map((week) => (
                                    <div key={week.week} className="p-3 rounded-lg border">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="font-semibold">Settimana {week.week}</p>
                                                <p className="text-sm text-muted-foreground">{week.focus}</p>
                                            </div>
                                            <Badge variant="outline">TSS: {week.targetTSS}</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {week.workouts.length} workout programmati
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* TSS Progression Chart */}
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-sm font-medium mb-2">Progressione TSS</p>
                                <div className="flex items-end gap-2 h-24">
                                    {weeklyStructure.map((week) => (
                                        <div key={week.week} className="flex-1 flex flex-col items-center">
                                            <div
                                                className="w-full bg-primary rounded-t"
                                                style={{
                                                    height: `${(week.targetTSS / Math.max(...weeklyStructure.map(w => w.targetTSS))) * 100}%`
                                                }}
                                            />
                                            <span className="text-xs mt-1">W{week.week}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coach Notes */}
                    <div>
                        <label className="text-sm font-medium">Note Coach (opzionali)</label>
                        <textarea
                            className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            rows={3}
                            placeholder="Aggiungi note o modifiche per l'atleta..."
                            value={coachNotes}
                            onChange={(e) => setCoachNotes(e.target.value)}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={onRegenerate}
                            className="flex-1"
                        >
                            Rigenera
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={approving}
                            className="flex-1"
                        >
                            {approving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Approvazione...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Approva e Assegna
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
