import { Users, Activity, TrendingUp, AlertTriangle, Heart, TestTube } from "lucide-react";
import { getCoachOverview, getAthletesWithStatus, getHRVAlerts, getRecentActivity } from "@/app/actions/coach-actions";
import AthleteStatusCard from "@/components/athlete-status-card";
import { CoachStatsCard } from "@/components/coach/coach-stats-card";
import { QuickActionsPanel } from "@/components/coach/quick-actions-panel";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function CoachDashboard() {
    const overview = await getCoachOverview();
    const athletes = await getAthletesWithStatus();
    const hrvAlerts = await getHRVAlerts();
    const recentActivity = await getRecentActivity();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Coach</h1>
                <p className="text-muted-foreground mt-2">
                    Monitora i tuoi atleti e il loro stato di recupero in tempo reale
                </p>
            </div>

            {/* Quick Actions */}
            <QuickActionsPanel />

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <CoachStatsCard
                    title="Atleti Totali"
                    value={overview.totalAthletes}
                    subtitle="Attivi nella piattaforma"
                    icon={<Users className="h-4 w-4" />}
                    variant="default"
                />

                <CoachStatsCard
                    title="Alert HRV"
                    value={overview.hrvAlerts.red + overview.hrvAlerts.nfor}
                    subtitle={`${overview.hrvAlerts.nfor} NFOR, ${overview.hrvAlerts.red} RED`}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    variant="danger"
                />

                <CoachStatsCard
                    title="Carico Moderato"
                    value={overview.hrvAlerts.yellow}
                    subtitle="Atleti in YELLOW"
                    icon={<Heart className="h-4 w-4" />}
                    variant="warning"
                />

                <CoachStatsCard
                    title="Test Recenti"
                    value={overview.recentTests}
                    subtitle="Ultimi 7 giorni"
                    icon={<TestTube className="h-4 w-4" />}
                    variant="success"
                />
            </div>

            {/* HRV Alerts Panel */}
            {hrvAlerts.length > 0 && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h2 className="text-xl font-semibold">⚠️ Alert Critici - Intervento Richiesto</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        Questi atleti necessitano attenzione immediata per prevenire overtraining o infortuni
                    </p>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {hrvAlerts.map(athlete => (
                            <AthleteStatusCard key={athlete.id} athlete={athlete} />
                        ))}
                    </div>
                </div>
            )}

            {/* Athletes Grid */}
            <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Tutti gli Atleti</h2>
                    <Link
                        href="/coach/athletes"
                        className="text-sm text-primary hover:underline"
                    >
                        Vista dettagliata →
                    </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {athletes.map(athlete => (
                        <AthleteStatusCard key={athlete.id} athlete={athlete} />
                    ))}
                </div>
                {athletes.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground">Nessun atleta ancora. Invita il tuo primo atleta!</p>
                    </div>
                )}
            </div>

            {/* Recent Activity Feed */}
            <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">Attività Recente</h2>
                </div>
                <div className="space-y-3">
                    {recentActivity.slice(0, 10).map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                            <div className={`mt-0.5 w-2 h-2 rounded-full ${activity.type === 'hrv' ? 'bg-blue-500' :
                                activity.type === 'test' ? 'bg-green-500' :
                                    'bg-purple-500'
                                }`} />
                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                    <Link href={`/coach/athletes/${activity.athleteId}`} className="hover:underline">
                                        {activity.athleteName}
                                    </Link>
                                    <span className="text-muted-foreground ml-1">
                                        {activity.type === 'hrv' ? '📊 ha registrato HRV' :
                                            activity.type === 'test' ? '🧪 ha completato test' :
                                                '📤 ha caricato attività'}
                                    </span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">{activity.details}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {new Date(activity.date).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
                {recentActivity.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Nessuna attività recente</p>
                )}
            </div>
        </div>
    );
}
