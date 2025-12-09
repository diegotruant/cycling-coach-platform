'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Battery, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { TodaysWorkout } from '@/components/athlete/todays-workout';
import { Notifications } from '@/components/athlete/notifications';
import { cn } from '@/lib/utils';
import { DailyPlanCard } from "@/components/dashboard/daily-plan-card";

interface AthleteDashboardClientProps {
    athlete: any;
    hrvStatus: 'GREEN' | 'YELLOW' | 'RED';
    currentHRV: number;
    recommendation: string;
    trendData: any[];
    finalWorkout: any;
    modificationReason: string | null;
    todaysWorkout: any;
    activeMesocycle: any;
}

export function AthleteDashboardClient({
    athlete,
    hrvStatus,
    currentHRV,
    recommendation,
    finalWorkout,
    modificationReason,
    todaysWorkout,
}: AthleteDashboardClientProps) {

    // Theme logic
    const theme = {
        GREEN: {
            bg: "bg-emerald-500",
            lightBg: "bg-emerald-50 dark:bg-emerald-950/30",
            text: "text-emerald-950 dark:text-emerald-50",
            border: "border-emerald-200 dark:border-emerald-800",
            icon: Zap,
            label: "SEI AL TOP!"
        },
        YELLOW: {
            bg: "bg-amber-400",
            lightBg: "bg-amber-50 dark:bg-amber-950/30",
            text: "text-amber-950 dark:text-amber-50",
            border: "border-amber-200 dark:border-amber-800",
            icon: Activity,
            label: "ATTENZIONE"
        },
        RED: {
            bg: "bg-rose-500",
            lightBg: "bg-rose-50 dark:bg-rose-950/30",
            text: "text-rose-950 dark:text-rose-50",
            border: "border-rose-200 dark:border-rose-800",
            icon: Battery,
            label: "RECUPERA"
        }
    }[hrvStatus] || {
        bg: "bg-slate-500",
        lightBg: "bg-slate-50",
        text: "text-slate-900",
        border: "border-slate-200",
        icon: Activity,
        label: "NO DATA"
    };

    const StatusIcon = theme.icon;

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6 pb-20">
            {/* Header with Greeting & Date */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tighter">
                        Ciao, {athlete.name.split(' ')[0]}
                    </h1>
                    <p className="text-muted-foreground text-sm capitalize">
                        {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Notifications />
                    <a href="/athlete/recovery" className="bg-primary text-primary-foreground h-9 w-9 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                        <Activity className="h-4 w-4" />
                    </a>
                </div>
            </div>

            {/* HERO CARD - TRAFFIC LIGHT */}
            <div className={cn(
                "relative overflow-hidden rounded-3xl p-6 md:p-10 transition-all duration-500 shadow-xl",
                theme.lightBg, theme.border, "border-2"
            )}>
                {/* Background decorative blob */}
                <div className={cn("absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20", theme.bg)} />

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12">
                    {/* Status Circle */}
                    <div className="flex flex-col items-center shrink-0">
                        <div className={cn(
                            "w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center shadow-2xl border-4 bg-background z-20 transition-transform hover:scale-105",
                            theme.border
                        )}>
                            <div className="flex flex-col items-center">
                                <span className={cn("text-5xl md:text-6xl font-black tracking-tighter", theme.text.split(' ')[0])}>
                                    {currentHRV > 0 ? currentHRV : '--'}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">RMSSD</span>
                            </div>
                        </div>
                        <div className={cn(
                            "mt-[-1rem] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-md bg-background z-30 border",
                            theme.text.split(' ')[0], theme.border
                        )}>
                            {theme.label}
                        </div>
                    </div>

                    {/* Feedback Text */}
                    <div className="flex-1 text-center md:text-left pt-2">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
                            {hrvStatus === 'GREEN' && "Tutti i sistemi operativi. Spingi forte oggi! 🚀"}
                            {hrvStatus === 'YELLOW' && "Accumulo di fatica rilevato. Mantieni l'intensità controllata."}
                            {hrvStatus === 'RED' && "Il tuo corpo chiede tregua. Priorità al recupero oggi."}
                            {!currentHRV && "Nessun dato HRV rilevato oggi."}
                        </h2>
                        <p className="text-muted-foreground text-lg leading-relaxed opacity-90 max-w-lg">
                            {recommendation}
                        </p>

                        {!currentHRV && (
                            <Button className="mt-4" variant="outline" asChild>
                                <a href="/athlete/recovery">Inserisci Dati Ora</a>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* TODAY'S MISSION */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold tracking-tight">Missione di Oggi</h3>
                </div>

                {todaysWorkout ? (
                    <TodaysWorkout workout={todaysWorkout} ftp={athlete.ftp || 250} athleteId={athlete.id} />
                ) : (
                    <DailyPlanCard
                        workout={finalWorkout}
                        modificationReason={modificationReason}
                        athleteFtp={athlete.ftp}
                    />
                )}
            </div>

            {/* QUICK STATS / FOOTER */}
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground opacity-50 text-center pt-8">
                <p>FTP Attuale: {athlete.ftp}W</p>
                <p>Ultimo Aggiornamento: {new Date().toLocaleTimeString()}</p>
            </div>
        </div>
    );
}
