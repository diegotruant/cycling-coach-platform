'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Zap } from "lucide-react";
import { PMCDataPoint } from "@/lib/physiology/pmc";
import { cn } from "@/lib/utils";

interface PerformanceKPIsProps {
    pmcData: PMCDataPoint[];
}

export function PerformanceKPIs({ pmcData }: PerformanceKPIsProps) {
    if (!pmcData || pmcData.length === 0) {
        return null;
    }

    // Get current values (last data point)
    const current = pmcData[pmcData.length - 1];
    const ctl = current.ctl;
    const atl = current.atl;
    const tsb = current.tsb;

    // Calculate 7-day and 28-day training load
    const last7Days = pmcData.slice(-7);
    const last28Days = pmcData.slice(-28);

    const load7d = last7Days.reduce((sum, d) => sum + d.tss, 0);
    const load28d = last28Days.reduce((sum, d) => sum + d.tss, 0);
    const weeklyAvg = Math.round(load28d / 4);

    // Determine form status
    const getFormStatus = (tsb: number): { label: string; color: string; bgColor: string } => {
        if (tsb > 10) return { label: 'Fresh', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' };
        if (tsb >= -10) return { label: 'Optimal', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' };
        if (tsb >= -30) return { label: 'Fatigued', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' };
        return { label: 'Very Fatigued', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
    };

    const formStatus = getFormStatus(tsb);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Fitness (CTL) */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fitness (CTL)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{ctl.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Chronic Training Load
                    </p>
                </CardContent>
            </Card>

            {/* Fatigue (ATL) */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fatigue (ATL)</CardTitle>
                    <TrendingDown className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{atl.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Acute Training Load
                    </p>
                </CardContent>
            </Card>

            {/* Form (TSB) */}
            <Card className={cn("border-2", formStatus.bgColor)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Form (TSB)</CardTitle>
                    <Activity className={cn("h-4 w-4", formStatus.color)} />
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold", formStatus.color)}>
                        {tsb > 0 ? '+' : ''}{tsb.toFixed(1)}
                    </div>
                    <p className={cn("text-xs font-medium mt-1", formStatus.color)}>
                        {formStatus.label}
                    </p>
                </CardContent>
            </Card>

            {/* Training Load */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Training Load</CardTitle>
                    <Zap className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{load7d}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        7-day TSS • {weeklyAvg}/week avg
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
