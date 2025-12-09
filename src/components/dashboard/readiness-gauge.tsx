'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Zap, Battery } from "lucide-react";

interface ReadinessGaugeProps {
    status: 'GREEN' | 'YELLOW' | 'RED';
    hrv: number;
    recommendation: string;
}

export function ReadinessGauge({ status, hrv, recommendation }: ReadinessGaugeProps) {
    const getColor = () => {
        switch (status) {
            case 'GREEN': return 'text-green-500 border-green-500 bg-green-500/10';
            case 'YELLOW': return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
            case 'RED': return 'text-red-500 border-red-500 bg-red-500/10';
            default: return 'text-gray-500 border-gray-500 bg-gray-500/10';
        }
    };

    const getIcon = () => {
        switch (status) {
            case 'GREEN': return <Zap className="h-8 w-8" />;
            case 'YELLOW': return <Activity className="h-8 w-8" />;
            case 'RED': return <Battery className="h-8 w-8" />; // Low battery
        }
    };

    const colorClass = getColor();
    const borderColor = status === 'GREEN' ? '#22c55e' : status === 'YELLOW' ? '#eab308' : '#ef4444';

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Readiness Giornaliera
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                    <div className={`relative flex items-center justify-center w-32 h-32 rounded-full border-4 ${status === 'GREEN' ? 'border-green-500' : status === 'YELLOW' ? 'border-yellow-500' : 'border-red-500'} bg-background shadow-lg transition-all duration-500`}>
                        <div className={`absolute inset-0 rounded-full opacity-20 ${status === 'GREEN' ? 'bg-green-500' : status === 'YELLOW' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        <div className="flex flex-col items-center z-10">
                            <span className={`text-4xl font-bold ${status === 'GREEN' ? 'text-green-600' : status === 'YELLOW' ? 'text-yellow-600' : 'text-red-600'}`}>
                                {hrv}
                            </span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">RMSSD</span>
                        </div>
                    </div>

                    <div className="mt-6 text-center space-y-2">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold border ${colorClass}`}>
                            {getIcon()}
                            <span>
                                {status === 'GREEN' && 'OTTIMO'}
                                {status === 'YELLOW' && 'AFFATICATO'}
                                {status === 'RED' && 'RECUPERO'}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
                            {recommendation}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
