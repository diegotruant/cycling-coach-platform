'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PowerCurvePoint {
    duration: number;
    watts: number;
    date: string;
}

interface PeakPowerTableProps {
    powerCurve: PowerCurvePoint[];
    weight?: number;
}

const KEY_DURATIONS = [
    { seconds: 5, label: '5 sec', description: 'Sprint' },
    { seconds: 10, label: '10 sec', description: 'Sprint' },
    { seconds: 30, label: '30 sec', description: 'Anaerobic' },
    { seconds: 60, label: '1 min', description: 'Anaerobic' },
    { seconds: 300, label: '5 min', description: 'VO2max' },
    { seconds: 1200, label: '20 min', description: 'FTP' },
    { seconds: 3600, label: '60 min', description: 'Endurance' },
];

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
}

export function PeakPowerTable({ powerCurve, weight = 70 }: PeakPowerTableProps) {
    if (!powerCurve || powerCurve.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Peak Power Records</CardTitle>
                    <CardDescription>Best power outputs across key durations</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                    No power records available
                </CardContent>
            </Card>
        );
    }

    // Create a map of duration to power record
    const recordsMap = new Map<number, PowerCurvePoint>();
    powerCurve.forEach(point => {
        recordsMap.set(point.duration, point);
    });

    // Get records for key durations
    const records = KEY_DURATIONS.map(kd => ({
        ...kd,
        record: recordsMap.get(kd.seconds)
    })).filter(r => r.record);

    if (records.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Peak Power Records</CardTitle>
                    <CardDescription>Best power outputs across key durations</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                    No power records available
                </CardContent>
            </Card>
        );
    }

    // Check for recent PRs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-600" />
                            Peak Power Records
                        </CardTitle>
                        <CardDescription>Best power outputs across key durations</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Duration</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Power</TableHead>
                            <TableHead className="text-right">W/kg</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.map((record, index) => {
                            if (!record.record) return null;

                            const wkg = (record.record.watts / weight).toFixed(2);
                            const recordDate = new Date(record.record.date);
                            const isRecent = recordDate >= thirtyDaysAgo;
                            const daysAgo = formatDate(record.record.date);

                            return (
                                <TableRow
                                    key={index}
                                    className={cn(
                                        index % 2 === 0 ? "bg-muted/30" : "",
                                        isRecent ? "border-l-4 border-l-green-500" : ""
                                    )}
                                >
                                    <TableCell className="font-medium">
                                        {record.label}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                            {record.description}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="font-mono font-bold text-lg">
                                                {record.record.watts}
                                            </span>
                                            <span className="text-xs text-muted-foreground">W</span>
                                            {isRecent && (
                                                <TrendingUp className="h-4 w-4 text-green-600" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {wkg}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {daysAgo}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                {records.some(r => r.record && new Date(r.record.date) >= thirtyDaysAgo) && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-4 h-4 border-l-4 border-l-green-500" />
                        <span>Recent PR (last 30 days)</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
