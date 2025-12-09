'use client';

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { archiveAthlete } from "@/app/actions/coach-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ArchiveAthleteButtonProps {
    athleteId: string;
    athleteName: string;
}

export function ArchiveAthleteButton({ athleteId, athleteName }: ArchiveAthleteButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'confirm' | 'success'>('confirm');
    const [path, setPath] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleArchive = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const folderPath = await archiveAthlete(athleteId);
            setPath(folderPath);
            setStep('success');
        } catch (error) {
            console.error("Failed to archive athlete", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseSuccess = () => {
        setOpen(false);
        router.push('/coach/athletes');
    };

    const onOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            // Reset state after a delay to allow animation to finish
            setTimeout(() => {
                setStep('confirm');
                setPath(null);
            }, 300);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button">
                    <Trash2 className="mr-2 h-4 w-4" /> Archivia Atleta
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                {step === 'confirm' ? (
                    <>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Questo rimuoverà <strong>{athleteName}</strong> dalla tua lista di atleti attivi.
                                Ti verrà fornito il percorso della cartella per eliminare manualmente i dati, se lo desideri.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLoading}>Annulla</AlertDialogCancel>
                            {/* Use a regular Button here to avoid auto-closing behavior of AlertDialogAction */}
                            <Button
                                variant="destructive"
                                onClick={handleArchive}
                                disabled={isLoading}
                            >
                                {isLoading ? "Archiviazione..." : "Archivia"}
                            </Button>
                        </AlertDialogFooter>
                    </>
                ) : (
                    <>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Atleta Archiviato</AlertDialogTitle>
                            <AlertDialogDescription className="space-y-4">
                                <p>
                                    <strong>{athleteName}</strong> è stato rimosso dalla tua dashboard.
                                </p>
                                <div className="p-4 bg-muted rounded-md border text-sm font-mono break-all select-all">
                                    {path}
                                </div>
                                <p>
                                    Per eliminare definitivamente tutti i dati, elimina manualmente la cartella al percorso sopra indicato.
                                </p>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogAction onClick={handleCloseSuccess}>
                                Ho capito
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </>
                )}
            </AlertDialogContent>
        </AlertDialog>
    );
}
