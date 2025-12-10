import { getAthlete, getAthleteDiary, getAthleteTrends } from "@/lib/storage";
import { updateAthleteProfile, saveAndRecalculateCP } from "@/app/actions/athlete-profile";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Activity, User as UserIcon, AlertTriangle, Calendar as CalendarIcon, LayoutDashboard, RefreshCw, TrendingUp, FileText } from "lucide-react";
import { recalculateMetricsAction } from '@/app/actions/metrics';
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import AssignWorkoutDialog from "@/components/assign-workout-dialog";
import { ReadinessGauge } from "@/components/dashboard/readiness-gauge";
import { HRVTrendChart } from "@/components/dashboard/hrv-trend-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarPageClient } from "@/components/calendar/calendar-page-client";
import { CalendarEvent } from "@/components/calendar/calendar-view";
import { PerformanceDashboard } from "@/components/dashboard/performance-dashboard";
import { MesocycleGeneratorButton } from "@/components/periodization/mesocycle-generator-button";
import { ArchiveAthleteButton } from "@/components/archive-athlete-button";
import { GenerateReportButton } from '@/components/coach/generate-report-button';
import { SyncActivitiesButton } from "@/components/coach/sync-activities-button";
import { AthleteDocumentsView } from "@/components/coach/athlete-documents-view";

export default async function AthleteProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId).trim();
    console.log(`[AthleteProfilePage] Requesting athlete with ID: '${id}' (raw: '${rawId}')`);
    const athlete = await getAthlete(id);

    if (!athlete) {
        console.log(`[AthleteProfilePage] Athlete not found for ID: ${id}`);
        notFound();
    }

    // Fetch Monitoring Data
    const diary = await getAthleteDiary(id);
    const trends = await getAthleteTrends(id);
    const today = new Date().toISOString().split('T')[0];

    const todayEntry = diary.find(e => e.date === today);
    const hrvStatus = todayEntry?.trafficLight || 'GREEN';
    const currentHRV = todayEntry?.hrv || 0;
    const recommendation = todayEntry?.notes || (hrvStatus === 'GREEN' ? 'Ready to train.' : 'No data available.');

    const trendData = diary
        .slice(0, 30)
        .map(e => ({
            date: e.date,
            hrv: e.hrv || 0,
            baseline: trends.baselineRMSSD?.mean || 0,
            status: e.trafficLight || 'GREEN'
        }))
        .filter(d => d.hrv > 0);

    // BMI Calculation
    const bmi = athlete.weight && athlete.height ? athlete.weight / Math.pow(athlete.height / 100, 2) : 0;
    const isBmiWarning = bmi > 0 && (bmi < 18.5 || bmi > 25);

    // Calendar Events
    const events: CalendarEvent[] = (athlete.assignments || []).map(a => ({
        id: a.id,
        date: a.date,
        title: a.workoutName,
        type: 'WORKOUT',
        status: a.status,
        description: a.notes,
        details: a.workoutStructure
    }));

    const updateAction = updateAthleteProfile.bind(null, athlete.id);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/coach/athletes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{athlete.name}</h2>
                    <p className="text-muted-foreground">{athlete.email}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary mr-2">
                        ID: {athlete.id}
                    </span>
                    <GenerateReportButton athlete={athlete} />
                    <SyncActivitiesButton athleteId={athlete.id} />
                    <MesocycleGeneratorButton athleteId={athlete.id} />
                    <AssignWorkoutDialog athleteId={athlete.id} athleteName={athlete.name} />
                </div>
            </div>

            <Tabs key="athlete-profile-tabs" defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Panoramica
                    </TabsTrigger>
                    <TabsTrigger value="calendar">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Calendario
                    </TabsTrigger>
                    <TabsTrigger value="performance">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Performance
                    </TabsTrigger>
                    <TabsTrigger value="documents">
                        <FileText className="mr-2 h-4 w-4" />
                        Documenti
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Monitoring Section */}
                    <div className="grid gap-6 md:grid-cols-12">
                        <div className="md:col-span-4 h-full">
                            <ReadinessGauge
                                status={hrvStatus}
                                hrv={currentHRV}
                                recommendation={recommendation}
                            />
                        </div>
                        <div className="md:col-span-8 h-full">
                            <HRVTrendChart data={trendData} />
                        </div>
                    </div>

                    <form action={updateAction}>
                        <div className="grid gap-8 lg:grid-cols-2">
                            {/* Personal Info */}
                            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
                                <div className="flex items-center gap-2 text-lg font-semibold">
                                    <UserIcon className="h-5 w-5 text-primary" />
                                    <h3>Dettagli Personali</h3>
                                </div>

                                {isBmiWarning && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Avviso BMI</AlertTitle>
                                        <AlertDescription>
                                            Il BMI dell&apos;atleta è {bmi.toFixed(1)}. Il range normale è 18.5 - 25.0.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Categoria</label>
                                        <select
                                            key={athlete.category} // Force re-render on change
                                            name="category"
                                            defaultValue={athlete.category?.toUpperCase() || "OPEN"}
                                            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="OPEN">Open</option>
                                            <option value="ELITE">Elite</option>
                                            <option value="MASTER">Master</option>
                                            <option value="ELITE_MASTER">Elite Master</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Sesso</label>
                                            <select
                                                name="sex"
                                                defaultValue={athlete.sex}
                                                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            >
                                                <option value="M">Maschio</option>
                                                <option value="F">Femmina</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Data di Nascita</label>
                                            <input
                                                type="date"
                                                name="dob"
                                                defaultValue={athlete.dob}
                                                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Peso (kg)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                name="weight"
                                                defaultValue={athlete.weight}
                                                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Altezza (cm)</label>
                                            <input
                                                type="number"
                                                name="height"
                                                defaultValue={athlete.height}
                                                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Physiological Metrics */}
                            <div className="rounded-xl border border-border bg-card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-lg font-semibold">
                                        <Activity className="h-5 w-5 text-secondary" />
                                        <h3>Metriche Fisiologiche</h3>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Ultimo aggiornamento: {athlete.metrics?.updatedAt ? new Date(athlete.metrics.updatedAt).toLocaleDateString() : 'Mai'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">FTP (W)</label>
                                        <input
                                            type="number"
                                            name="ftp"
                                            defaultValue={athlete.ftp}
                                            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">MAP (W)</label>
                                        <input
                                            type="number"
                                            name="map"
                                            defaultValue={athlete.map}
                                            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Critical Power (CP)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                name="cp"
                                                defaultValue={athlete.metrics?.cp || athlete.cp}
                                                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-mono flex-1"
                                            />
                                            <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
                                                Modello: {athlete.metrics?.cp ? 'Calc' : 'Stim'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">W&apos; (J)</label>
                                        <input
                                            type="number"
                                            name="w_prime"
                                            defaultValue={athlete.metrics?.wPrime || athlete.w_prime}
                                            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Pmax (W)</label>
                                        <input
                                            type="number"
                                            name="p_max"
                                            defaultValue={athlete.metrics?.pMax || athlete.p_max}
                                            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Max HR (bpm)</label>
                                        <input
                                            type="number"
                                            name="maxHR"
                                            defaultValue={athlete.maxHR}
                                            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">VLaMax (mmol/L/s)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="vlamax"
                                            defaultValue={athlete.vlamax}
                                            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">APR (W)</label>
                                        <input
                                            type="number"
                                            name="apr"
                                            defaultValue={athlete.apr}
                                            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                        />
                                    </div>
                                    <div className="grid gap-2 col-span-2">
                                        <label className="text-sm font-medium">Profilo Corridore (Calcolato)</label>
                                        <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm font-mono font-bold">
                                            {athlete.riderProfile || 'Sconosciuto'}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 border-t border-border pt-4">
                                    <h4 className="text-sm font-semibold mb-3">Migliori Prestazioni (per Modello CP)</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-xs font-medium">3 min (W)</label>
                                            <input
                                                type="number"
                                                name="best_3min"
                                                defaultValue={athlete.best_3min}
                                                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-medium">5 min (W)</label>
                                            <input
                                                type="number"
                                                name="best_5min"
                                                defaultValue={athlete.best_5min}
                                                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-medium">12 min (W)</label>
                                            <input
                                                type="number"
                                                name="best_12min"
                                                defaultValue={athlete.best_12min}
                                                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-border space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">W/kg</span>
                                        <span className="font-mono font-bold">
                                            {athlete.ftp && athlete.weight
                                                ? (athlete.ftp / athlete.weight).toFixed(2)
                                                : '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">BMI</span>
                                        <span className={cn("font-mono font-bold", isBmiWarning ? "text-destructive" : "")}>
                                            {bmi.toFixed(1)}
                                        </span>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        type="submit"
                                        formAction={saveAndRecalculateCP.bind(null, athlete.id)}
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" /> Ricalcola Modello CP
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-between items-center">
                            <ArchiveAthleteButton athleteId={athlete.id} athleteName={athlete.name} />
                            <Button type="submit">
                                <Save className="mr-2 h-4 w-4" /> Salva Modifiche
                            </Button>
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="calendar">
                    <div className="rounded-xl border border-border bg-card p-6 min-h-[600px]">
                        <CalendarPageClient events={events} athleteFtp={athlete.ftp || 200} athleteId={athlete.id} />
                    </div>
                </TabsContent>

                <TabsContent value="performance">
                    <PerformanceDashboard athlete={athlete} />
                </TabsContent>

                <TabsContent value="documents">
                    <div className="rounded-xl border border-border bg-card p-6">
                        <div className="flex items-center gap-2 text-lg font-semibold mb-6">
                            <FileText className="h-5 w-5 text-primary" />
                            <h3>Documenti Atleta</h3>
                        </div>
                        <AthleteDocumentsView
                            documents={athlete.documents || []}
                            athleteId={athlete.id}
                            athleteName={athlete.name}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
