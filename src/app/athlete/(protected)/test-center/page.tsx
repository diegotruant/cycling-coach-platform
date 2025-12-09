import { cookies } from "next/headers";
import { TEST_PROTOCOLS } from "@/lib/workouts/protocols";
import { Button } from "@/components/ui/button";
import { FileCode, FileText, Heart, AlertTriangle, TrendingUp } from "lucide-react";
import { getRecoveryEntries } from "@/app/actions/recovery";
import { calculateBaseline, calculateTrafficLight } from "@/lib/hrv-analysis";

export default async function TestCenterPage() {
    const cookieStore = await cookies();
    const athleteId = cookieStore.get('athlete_session')?.value;

    // Fetch HRV status
    let hrvStatus: 'GREEN' | 'YELLOW' | 'RED' | null = null;
    let hrvRecommendation = '';

    if (athleteId) {
        const recoveryEntries = await getRecoveryEntries(athleteId);
        const latestHRV = recoveryEntries[0];

        if (latestHRV?.hrv) {
            const recentHRV = recoveryEntries
                .filter(e => e.hrv && e.hrv > 0)
                .slice(0, 30)
                .map(e => e.hrv!);
            const baseline = calculateBaseline(recentHRV, 7);

            if (baseline.mean > 0) {
                const analysis = calculateTrafficLight(latestHRV.hrv, baseline.mean);
                hrvStatus = analysis.status;

                // Set workout-specific recommendations
                if (hrvStatus === 'GREEN') {
                    hrvRecommendation = 'Pu oi scaricare ed eseguire i test alla massima intensità.';
                } else if (hrvStatus === 'YELLOW') {
                    hrvRecommendation = 'Puoi eseguire i test ma riduci intensità target del 5-10%. Ascolta le sensazioni.';
                } else {
                    hrvRecommendation = 'NON eseguire test oggi. Sistema nervoso sovraccarico. Rischio infortunio/prestazione scarsa.';
                }
            }
        }
    }

    const protocols = Object.values(TEST_PROTOCOLS);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Test Center</h1>
                <p className="text-muted-foreground mt-2">
                    Download standard testing protocols and view your power curve results.
                </p>
            </div>

            {/* HRV Status Banner */}
            {hrvStatus && (
                <div className={`rounded-xl border p-6 ${hrvStatus === 'GREEN'
                    ? 'bg-green-500/10 border-green-500/30'
                    : hrvStatus === 'YELLOW'
                        ? 'bg-orange-500/10 border-orange-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}>
                    <div className="flex items-start gap-3">
                        {hrvStatus === 'RED' ? (
                            <AlertTriangle className="h-6 w-6 text-red-500 mt-0.5" />
                        ) : (
                            <Heart className={`h-6 w-6 mt-0.5 ${hrvStatus === 'GREEN' ? 'text-green-500' : 'text-orange-500'
                                }`} />
                        )}
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">
                                {hrvStatus === 'GREEN' && '🟢 HRV Ottimale per Testing'}
                                {hrvStatus === 'YELLOW' && '🟠 HRV in Calo - Testing con Cautela'}
                                {hrvStatus === 'RED' && '🔴 HRV Critica - EVITA Testing Oggi'}
                            </h3>
                            <p className="text-sm mb-3">{hrvRecommendation}</p>
                            {hrvStatus === 'RED' && (
                                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-sm">
                                    <strong>⚠️ Importante:</strong> Test massimali con HRV depressa possono causare:
                                    <ul className="mt-2 ml-4 space-y-1">
                                        <li>• Risultati non rappresentativi (sottostima capacità reali)</li>
                                        <li>• Rischio infortunio aumentato</li>
                                        <li>• Sovraccarico ulteriore del sistema nervoso</li>
                                    </ul>
                                    <p className="mt-2"><strong>Raccomandazione:</strong> Riposa oggi, riprogramma test tra 2-3 giorni quando HRV recuperata.</p>
                                </div>
                            )}
                            {hrvStatus === 'YELLOW' && (
                                <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 text-sm">
                                    <strong>💡 Suggerimento:</strong> Se decidi di testare, riduci target del 5-10%.
                                    Se durante test sensazioni molto negative, interrompi e riprogramma.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!hrvStatus && athleteId && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6">
                    <div className="flex items-start gap-3">
                        <Heart className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                            <h3 className="font-semibold mb-1">Nessun Dato HRV Oggi</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Per raccomandazioni scientifiche sui test, misura il tuo HRV prima di scaricare i workout.
                            </p>
                            <a
                                href="/athlete/recovery"
                                className="inline-flex px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm font-medium"
                            >
                                Misura HRV Ora
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {protocols.map((protocol) => {
                    const testType = protocol.id.replace('test-', '');

                    return (
                        <div key={protocol.id} className={`rounded-xl border bg-card p-6 shadow-sm transition-all ${hrvStatus === 'RED'
                            ? 'border-red-500/30 opacity-60'
                            : hrvStatus === 'YELLOW'
                                ? 'border-orange-500/20'
                                : 'border-border hover:shadow-md'
                            }`}>
                            <div className="mb-4">
                                <h3 className="text-xl font-semibold">{protocol.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{protocol.description}</p>
                            </div>

                            <div className="flex flex-col gap-2 mt-auto">
                                {hrvStatus === 'RED' && (
                                    <div className="mb-2 p-2 rounded bg-red-500/20 text-xs text-center font-semibold text-red-600">
                                        ⛔ Non raccomandato oggi
                                    </div>
                                )}
                                {hrvStatus === 'YELLOW' && (
                                    <div className="mb-2 p-2 rounded bg-orange-500/20 text-xs text-center font-semibold text-orange-600">
                                        ⚠️ Riduci intensità 5-10%
                                    </div>
                                )}
                                {hrvStatus === 'GREEN' && (
                                    <div className="mb-2 p-2 rounded bg-green-500/20 text-xs text-center font-semibold text-green-600">
                                        ✅ Ottimale per testing
                                    </div>
                                )}

                                {/* View Results Button */}
                                <a href={`/athlete/test-center/${testType}`} className="w-full">
                                    <Button variant="default" className="w-full">
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        View Results & Charts
                                    </Button>
                                </a>

                                <div className="flex gap-2">
                                    <a href={`/api/download-test-protocol?type=${testType.toUpperCase()}&format=zwo`} className="w-full">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            disabled={hrvStatus === 'RED'}
                                            size="sm"
                                        >
                                            <FileCode className="mr-2 h-4 w-4 text-orange-500" />
                                            .ZWO
                                        </Button>
                                    </a>
                                    <a href={`/api/download-test-protocol?type=${testType.toUpperCase()}&format=erg`} className="w-full">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            disabled={hrvStatus === 'RED'}
                                            size="sm"
                                        >
                                            <FileText className="mr-2 h-4 w-4 text-blue-500" />
                                            .ERG
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
