'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { syncStravaActivitiesAction } from "@/app/actions/integrations";
import { useToast } from "@/components/ui/use-toast";

interface StravaCardProps {
    isConnected: boolean;
    authUrl: string;
    lastSync?: string;
}

export function StravaCard({ isConnected, authUrl, lastSync }: StravaCardProps) {
    const [isSyncing, setIsSyncing] = useState(false);
    const { toast } = useToast();

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const result = await syncStravaActivitiesAction();
            if (result.error) {
                toast({ title: "Sincronizzazione Fallita", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "Sincronizzazione Completata", description: `Sincronizzate ${result.count} attività.` });
            }
        } catch (e) {
            toast({ title: "Errore", description: "Qualcosa è andato storto.", variant: "destructive" });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
                <div className="bg-[#FC4C02] text-white p-2 rounded font-bold text-xs w-10 h-10 flex items-center justify-center">STRAVA</div>
                <div>
                    <h3 className="font-semibold">Strava</h3>
                    <p className="text-sm text-muted-foreground">
                        {isConnected ? 'Account connesso.' : 'Sincronizza le attività automaticamente.'}
                        {lastSync && <span className="block text-xs mt-1">Ultima attività: {new Date(lastSync).toLocaleDateString()}</span>}
                    </p>
                </div>
            </div>
            <div>
                {isConnected ? (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-green-600 mr-4">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium hidden sm:inline">Connesso</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Sincronizzazione...' : 'Sincronizza Ora'}
                        </Button>
                    </div>
                ) : (
                    <a href={authUrl}>
                        <Button variant="outline" className="border-[#FC4C02] text-[#FC4C02] hover:bg-[#FC4C02] hover:text-white">
                            Connetti
                        </Button>
                    </a>
                )}
            </div>
        </div>
    );
}
