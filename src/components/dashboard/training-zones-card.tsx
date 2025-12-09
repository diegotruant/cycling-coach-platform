'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrainingZonesCardProps {
    ftp?: number;
    maxHR?: number;
}

const POWER_ZONES = [
    { name: 'Z1: Active Recovery', min: 0, max: 0.55, color: 'bg-gray-400', textColor: 'text-gray-700' },
    { name: 'Z2: Endurance', min: 0.56, max: 0.75, color: 'bg-blue-400', textColor: 'text-blue-700' },
    { name: 'Z3: Tempo', min: 0.76, max: 0.90, color: 'bg-green-400', textColor: 'text-green-700' },
    { name: 'Z4: Threshold', min: 0.91, max: 1.05, color: 'bg-yellow-400', textColor: 'text-yellow-700' },
    { name: 'Z5: VO2max', min: 1.06, max: 1.20, color: 'bg-orange-400', textColor: 'text-orange-700' },
    { name: 'Z6: Anaerobic', min: 1.21, max: 1.50, color: 'bg-red-400', textColor: 'text-red-700' },
    { name: 'Z7: Neuromuscular', min: 1.51, max: 3.00, color: 'bg-purple-400', textColor: 'text-purple-700' },
];

const HR_ZONES = [
    { name: 'Z1: Recovery', min: 0.50, max: 0.60, color: 'bg-gray-400' },
    { name: 'Z2: Aerobic', min: 0.60, max: 0.70, color: 'bg-blue-400' },
    { name: 'Z3: Tempo', min: 0.70, max: 0.80, color: 'bg-green-400' },
    { name: 'Z4: Threshold', min: 0.80, max: 0.90, color: 'bg-yellow-400' },
    { name: 'Z5: Anaerobic', min: 0.90, max: 1.00, color: 'bg-red-400' },
];

export function TrainingZonesCard({ ftp, maxHR }: TrainingZonesCardProps) {
    if (!ftp && !maxHR) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Training Zones</CardTitle>
                    <CardDescription>Power and heart rate training zones</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                    Set FTP or Max HR to view training zones
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Training Zones</CardTitle>
                <CardDescription>Power and heart rate training zones based on your metrics</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Power Zones */}
                    {ftp && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm">Power Zones</h4>
                                <Badge variant="outline">FTP: {ftp}W</Badge>
                            </div>
                            <div className="space-y-2">
                                {POWER_ZONES.map((zone, index) => {
                                    const minWatts = Math.round(ftp * zone.min);
                                    const maxWatts = Math.round(ftp * zone.max);
                                    const percentage = Math.round((zone.min + zone.max) / 2 * 100);

                                    return (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="w-32 text-xs font-medium truncate">
                                                {zone.name}
                                            </div>
                                            <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden relative">
                                                <div
                                                    className={cn("h-full", zone.color)}
                                                    style={{ width: `${Math.min(100, percentage)}%` }}
                                                />
                                            </div>
                                            <div className="w-32 text-right">
                                                <div className="text-xs font-mono font-semibold">
                                                    {minWatts}-{maxWatts}W
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {Math.round(zone.min * 100)}-{Math.round(zone.max * 100)}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Heart Rate Zones */}
                    {maxHR && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm">Heart Rate Zones</h4>
                                <Badge variant="outline">Max HR: {maxHR} bpm</Badge>
                            </div>
                            <div className="space-y-2">
                                {HR_ZONES.map((zone, index) => {
                                    const minHR = Math.round(maxHR * zone.min);
                                    const maxHRZone = Math.round(maxHR * zone.max);
                                    const percentage = Math.round((zone.min + zone.max) / 2 * 100);

                                    return (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="w-32 text-xs font-medium truncate">
                                                {zone.name}
                                            </div>
                                            <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden relative">
                                                <div
                                                    className={cn("h-full", zone.color)}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <div className="w-32 text-right">
                                                <div className="text-xs font-mono font-semibold">
                                                    {minHR}-{maxHRZone} bpm
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {Math.round(zone.min * 100)}-{Math.round(zone.max * 100)}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
