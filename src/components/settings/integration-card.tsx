'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle, Settings } from "lucide-react";
import { IntegrationConfig, getAuthUrl } from "@/lib/integrations/config";
import { useToast } from "@/components/ui/use-toast";

interface IntegrationCardProps {
    config: IntegrationConfig;
    isConnected: boolean;
    onConnect?: () => void;
}

export function IntegrationCard({ config, isConnected, onConnect }: IntegrationCardProps) {
    const { toast } = useToast();

    const handleConnect = () => {
        if (onConnect) {
            onConnect();
            return;
        }

        if (config.type === 'OAUTH') {
            // For Strava we have a specific flow, but for others we use the generic mock
            if (config.id === 'strava') {
                window.location.href = '/api/integrations/strava/auth'; // We'll need to create this or use the helper directly
                // Actually, let's just use the helper from config for now which returns a mock callback
                window.location.href = getAuthUrl(config.id);
            } else {
                window.location.href = getAuthUrl(config.id);
            }
        } else {
            toast({ title: "Configurazione Richiesta", description: "Questa integrazione richiede una configurazione manuale (API Key o File Sync). Funzionalità in arrivo." });
        }
    };

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
                <div
                    className="text-white p-2 rounded font-bold text-xs w-10 h-10 flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: config.color }}
                >
                    {config.iconText}
                </div>
                <div>
                    <h3 className="font-semibold">{config.name}</h3>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
            </div>
            <div>
                {isConnected ? (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium hidden sm:inline">Connesso</span>
                        <Button variant="ghost" size="icon">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>
                ) : (
                    <Button
                        variant="outline"
                        className="transition-colors"
                        style={{ borderColor: config.color, color: config.color }}
                        onClick={handleConnect}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = config.color; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = config.color; }}
                    >
                        Connect
                    </Button>
                )}
            </div>
        </div>
    );
}
