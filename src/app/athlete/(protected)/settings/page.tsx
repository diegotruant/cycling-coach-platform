import { getAthlete } from "@/lib/storage";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStravaAuthUrl } from "@/lib/integrations/strava";
import { CheckCircle } from "lucide-react";
import { StravaCard } from "@/components/settings/strava-card";
import { INTEGRATIONS_CONFIG } from "@/lib/integrations/config";
import { IntegrationCard } from "@/components/settings/integration-card";

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const athleteId = cookieStore.get('athlete_session')?.value;
    if (!athleteId) return <div>Not logged in</div>;

    const athlete = await getAthlete(athleteId);
    if (!athlete) return <div>Athlete not found</div>;

    const stravaConnected = !!athlete.integrations?.strava?.accessToken;
    const stravaAuthUrl = getStravaAuthUrl();

    return (
        <div className="container py-10 space-y-8">
            <h1 className="text-3xl font-bold">Impostazioni</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Integrazioni</CardTitle>
                    <CardDescription>Connetti i tuoi strumenti preferiti per sincronizzare i dati automaticamente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.values(INTEGRATIONS_CONFIG).map((config) => (
                        <IntegrationCard
                            key={config.id}
                            config={config}
                            isConnected={!!athlete.integrations?.[config.id as keyof typeof athlete.integrations]}
                        />
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
