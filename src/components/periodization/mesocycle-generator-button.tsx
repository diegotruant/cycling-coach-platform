'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { MesocycleApprovalDialog } from './mesocycle-approval-dialog';
import { MesocycleConfigDialog } from './mesocycle-config-dialog';
import { Mesocycle } from '@/lib/periodization/types';

interface MesocycleGeneratorButtonProps {
    athleteId: string;
}

export function MesocycleGeneratorButton({ athleteId }: MesocycleGeneratorButtonProps) {
    const [generating, setGenerating] = useState(false);
    const [mesocycle, setMesocycle] = useState<Mesocycle | null>(null);
    const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
    const [configDialogOpen, setConfigDialogOpen] = useState(false);

    const handleStartGeneration = () => {
        setConfigDialogOpen(true);
    };

    const handleGenerate = async (config: { protocolId: string; weeks: number }) => {
        setGenerating(true);
        try {
            const response = await fetch('/api/periodization/generate-mesocycle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    athleteId,
                    coachId: 'coach_1', // TODO: Get from session
                    weeks: config.weeks,
                    forceProtocol: config.protocolId
                })
            });

            if (!response.ok) {
                throw new Error('Errore nella generazione del mesociclo');
            }

            const data = await response.json();
            setMesocycle(data);
            setApprovalDialogOpen(true);
        } catch (error) {
            console.error('Error generating mesocycle:', error);
            alert('Errore nella generazione del mesociclo. Verifica la configurazione API.');
        } finally {
            setGenerating(false);
        }
    };

    const handleApprove = async (mesocycle: Mesocycle, notes?: string) => {
        try {
            const response = await fetch('/api/periodization/approve-mesocycle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mesocycle,
                    athleteId,
                    coachId: 'coach_1', // TODO: Get from session
                    coachNotes: notes
                })
            });

            if (!response.ok) {
                throw new Error('Errore nell\'approvazione del mesociclo');
            }

            const data = await response.json();
            alert(`✅ Mesociclo approvato!\n\n${data.message}\n\nWorkout assegnati all'atleta.`);

            // Refresh page to show new assignments
            window.location.reload();
        } catch (error) {
            console.error('Error approving mesocycle:', error);
            alert('Errore nell\'approvazione del mesociclo.');
        }
    };

    const handleRegenerate = () => {
        setApprovalDialogOpen(false);
        setConfigDialogOpen(true); // Go back to config
    };

    return (
        <>
            <Button
                onClick={handleStartGeneration}
                disabled={generating}
                variant="outline"
            >
                {generating ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generazione...
                    </>
                ) : (
                    <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Genera Mesociclo AI
                    </>
                )}
            </Button>

            <MesocycleConfigDialog
                isOpen={configDialogOpen}
                onClose={() => setConfigDialogOpen(false)}
                onGenerate={handleGenerate}
                athleteId={athleteId}
            />

            <MesocycleApprovalDialog
                mesocycle={mesocycle}
                open={approvalDialogOpen}
                onOpenChange={setApprovalDialogOpen}
                onApprove={handleApprove}
                onRegenerate={handleRegenerate}
            />
        </>
    );
}
