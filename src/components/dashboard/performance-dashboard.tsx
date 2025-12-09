'use client';

import { AthleteConfig } from "@/lib/storage";
import { calculatePMC } from "@/lib/physiology/pmc";
import { PMCChart } from "./pmc-chart";
import { PowerCurveChart } from "./power-curve-chart";
import { ActivityFeed } from "./activity-feed";
import { PerformanceKPIs } from "./performance-kpis";
import { TrainingZonesCard } from "./training-zones-card";
import { LoadSummaryCard } from "./load-summary-card";
import { PeakPowerTable } from "./peak-power-table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { generateMockDataAction } from "@/app/actions/performance";
import { exportPMCToCSV, exportPowerCurveToCSV, exportActivitiesToCSV, exportAllData } from "@/lib/export-utils";
import { Sparkles, Download, FileText, Activity, TrendingUp } from "lucide-react";

interface PerformanceDashboardProps {
    athlete: AthleteConfig;
}

export function PerformanceDashboard({ athlete }: PerformanceDashboardProps) {
    const pmcData = calculatePMC(athlete.assignments || [], 90);
    const powerCurveData = athlete.metrics?.powerCurve || [];

    const handleExport = (type: 'pmc' | 'power' | 'activities' | 'all') => {
        switch (type) {
            case 'pmc':
                exportPMCToCSV(pmcData, athlete.name);
                break;
            case 'power':
                exportPowerCurveToCSV(powerCurveData, athlete.name);
                break;
            case 'activities':
                exportActivitiesToCSV(athlete.assignments, athlete.name);
                break;
            case 'all':
                exportAllData(pmcData, powerCurveData, athlete.assignments, athlete.name);
                break;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Performance Analytics</h3>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Export Data
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport('pmc')}>
                                <TrendingUp className="mr-2 h-4 w-4" />
                                PMC Data (CSV)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('power')}>
                                <Activity className="mr-2 h-4 w-4" />
                                Power Curve (CSV)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('activities')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Activities (CSV)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleExport('all')}>
                                <Download className="mr-2 h-4 w-4" />
                                Export All
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                            await generateMockDataAction(athlete.id);
                        }}
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Demo Data
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <PerformanceKPIs pmcData={pmcData} />

            {/* Training Zones */}
            <TrainingZonesCard ftp={athlete.ftp} />

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                    <PMCChart data={pmcData} />
                </div>
                <div>
                    <PowerCurveChart data={powerCurveData} ftp={athlete.ftp} weight={athlete.weight} />
                </div>
                <div>
                    <ActivityFeed assignments={athlete.assignments} />
                </div>
            </div>

            {/* Load Summary and Peak Power */}
            <div className="grid gap-6 md:grid-cols-2">
                <LoadSummaryCard pmcData={pmcData} assignments={athlete.assignments} />
                <PeakPowerTable powerCurve={powerCurveData} weight={athlete.weight} />
            </div>
        </div>
    );
}
