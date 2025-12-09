'use client';

import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { syncAthleteActivities } from "@/app/actions/integrations";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface SyncActivitiesButtonProps {
    athleteId: string;
}

export function SyncActivitiesButton({ athleteId }: SyncActivitiesButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSync = async () => {
        setIsLoading(true);
        try {
            const result = await syncAthleteActivities(athleteId);
            if (result.success) {
                toast({
                    title: "Sincronizzazione completata",
                    description: `Aggiornate ${result.count || 0} attività da Intervals.icu (o demo).`,
                });
            } else {
                toast({
                    title: "Errore sincronizzazione",
                    description: result.error,
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Errore",
                description: "Si è verificato un errore imprevisto.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isLoading}
            className="gap-2"
        >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizza
        </Button>
    );
}
