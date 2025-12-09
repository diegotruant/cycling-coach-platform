'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ProtocolSummary {
    id: string;
    name: string;
    description: string;
    typicalDuration: number;
    minWeeks: number;
    maxWeeks: number;
}

interface MesocycleConfigDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (config: { protocolId: string; weeks: number }) => void;
    athleteId: string;
}

export function MesocycleConfigDialog({ isOpen, onClose, onGenerate, athleteId }: MesocycleConfigDialogProps) {
    const [loading, setLoading] = useState(false);
    const [protocols, setProtocols] = useState<ProtocolSummary[]>([]);
    const [selectedProtocolId, setSelectedProtocolId] = useState<string>('');
    const [weeks, setWeeks] = useState<number>(4);
    const [recommendation, setRecommendation] = useState<{ id: string; rationale: string } | null>(null);

    useEffect(() => {
        if (isOpen && athleteId) {
            fetchRecommendation();
        }
    }, [isOpen, athleteId]);

    const fetchRecommendation = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/periodization/recommendation?athleteId=${athleteId}`);
            if (response.ok) {
                const data = await response.json();
                setProtocols(data.protocols);
                setRecommendation({
                    id: data.recommendedProtocolId,
                    rationale: data.rationale
                });
                // Set default selection to recommended
                if (!selectedProtocolId) {
                    setSelectedProtocolId(data.recommendedProtocolId);
                    const recommendedProtocol = data.protocols.find((p: any) => p.id === data.recommendedProtocolId);
                    if (recommendedProtocol) {
                        setWeeks(recommendedProtocol.typicalDuration);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching recommendation:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProtocolChange = (value: string) => {
        setSelectedProtocolId(value);
        const protocol = protocols.find(p => p.id === value);
        if (protocol) {
            // Reset weeks to typical if protocol changes
            setWeeks(protocol.typicalDuration);
        }
    };

    const handleSubmit = () => {
        if (selectedProtocolId && weeks) {
            onGenerate({ protocolId: selectedProtocolId, weeks });
            onClose();
        }
    };

    const selectedProtocol = protocols.find(p => p.id === selectedProtocolId);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Configura Mesociclo</DialogTitle>
                    <DialogDescription>
                        Scegli il protocollo di allenamento e la durata.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {recommendation && (
                            <Alert className="bg-blue-50 border-blue-200">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-blue-800">Consiglio Evidence-Based</AlertTitle>
                                <AlertDescription className="text-blue-700 text-sm mt-1">
                                    {recommendation.rationale}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="protocol">Protocollo</Label>
                            <Select value={selectedProtocolId} onValueChange={handleProtocolChange}>
                                <SelectTrigger id="protocol">
                                    <SelectValue placeholder="Seleziona un protocollo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {protocols.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name} {recommendation?.id === p.id && '✨ (Consigliato)'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedProtocol && (
                                <p className="text-sm text-muted-foreground">
                                    {selectedProtocol.description}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="weeks">Durata (Settimane)</Label>
                            <Select value={weeks.toString()} onValueChange={(v) => setWeeks(parseInt(v))}>
                                <SelectTrigger id="weeks">
                                    <SelectValue placeholder="Seleziona durata" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedProtocol && Array.from(
                                        { length: selectedProtocol.maxWeeks - selectedProtocol.minWeeks + 1 },
                                        (_, i) => selectedProtocol.minWeeks + i
                                    ).map((w) => (
                                        <SelectItem key={w} value={w.toString()}>
                                            {w} Settimane {w === selectedProtocol.typicalDuration && '(Tipica)'}
                                        </SelectItem>
                                    ))}
                                    {!selectedProtocol && (
                                        <SelectItem value="4">4 Settimane</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Annulla</Button>
                    <Button onClick={handleSubmit} disabled={!selectedProtocolId || loading}>
                        Genera Mesociclo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
