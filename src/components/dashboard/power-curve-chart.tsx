'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface PowerCurvePoint {
    duration: number;
    watts: number;
    date: string;
}

interface PowerCurveChartProps {
    data: PowerCurvePoint[];
    ftp?: number;
    weight?: number;
}

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
}

const CustomTooltip = ({ active, payload, label, weight = 70 }: any) => {
    if (active && payload && payload.length) {
        const point = payload[0].payload;
        const wkg = (point.watts / weight).toFixed(2);

        return (
            <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                <p className="font-semibold">{formatDuration(point.duration)}</p>
                <p className="text-sm text-muted-foreground">Power: <span className="font-mono font-bold text-foreground">{point.watts}W</span></p>
                <p className="text-sm text-muted-foreground">W/kg: <span className="font-mono">{wkg}</span></p>
                <div className="text-xs text-muted-foreground mt-1">Weight used: {weight}kg</div>
                <p className="text-xs text-muted-foreground">Date: {new Date(point.date).toLocaleDateString()}</p>
            </div>
        );
    }
    return null;
};

export function PowerCurveChart({ data, ftp, weight = 70 }: PowerCurveChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Power Duration Curve</CardTitle>
                    <CardDescription>Mean Maximal Power (MMP) across different durations</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No power data available
                </CardContent>
            </Card>
        );
    }

    // Sort by duration
    const sortedData = [...data].sort((a, b) => a.duration - b.duration);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Power Duration Curve</CardTitle>
                <CardDescription>Mean Maximal Power (MMP) across different durations</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sortedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                                dataKey="duration"
                                tickFormatter={formatDuration}
                                type="number"
                                scale="log"
                                domain={['auto', 'auto']}
                                allowDataOverflow
                            />
                            <YAxis label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip content={<CustomTooltip weight={weight} />} />
                            <Legend />

                            {/* FTP Reference Line */}
                            {ftp && (
                                <ReferenceLine
                                    y={ftp}
                                    stroke="#666"
                                    strokeDasharray="3 3"
                                    label={{ value: `FTP: ${ftp}W`, position: 'right', fill: '#666', fontSize: 12 }}
                                />
                            )}

                            <Line
                                type="monotone"
                                dataKey="watts"
                                name="Best Power"
                                stroke="#ef4444"
                                strokeWidth={3}
                                dot={{ r: 5, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
