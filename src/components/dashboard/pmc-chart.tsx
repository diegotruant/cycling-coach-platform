'use client';

import { ResponsiveContainer, ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PMCDataPoint } from '@/lib/physiology/pmc';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';

interface PMCChartProps {
    data: PMCDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const today = new Date().toISOString().split('T')[0];
        const isToday = data.date === today;

        // Determine form status
        const getFormStatus = (tsb: number) => {
            if (tsb > 25) return { label: 'Transition', color: 'text-gray-500' };
            if (tsb > 5) return { label: 'Freshness', color: 'text-green-600' };
            if (tsb >= -10) return { label: 'Neutral', color: 'text-blue-600' };
            if (tsb >= -30) return { label: 'Optimal Load', color: 'text-green-600' };
            return { label: 'High Risk', color: 'text-red-600' };
        };

        const formStatus = getFormStatus(data.tsb);

        return (
            <div className="bg-background/95 border border-border rounded-lg p-3 shadow-xl min-w-[200px] backdrop-blur-sm">
                <p className="font-semibold mb-2 flex justify-between items-center">
                    <span>{new Date(label).toLocaleDateString('it-IT', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {isToday && <span className="ml-2 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">TODAY</span>}
                </p>
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Fitness (CTL):</span>
                        <span className="font-mono font-bold text-blue-500">{data.ctl.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Fatigue (ATL):</span>
                        <span className="font-mono font-bold text-purple-500">{data.atl.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Form (TSB):</span>
                        <span className={`font-mono font-bold ${formStatus.color}`}>
                            {data.tsb > 0 ? '+' : ''}{data.tsb.toFixed(1)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-border">
                        <span className="text-muted-foreground">Daily Load (TSS):</span>
                        <span className="font-mono font-bold">{data.tss}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-muted-foreground">Zone:</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-muted ${formStatus.color}`}>
                            {formStatus.label}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export function PMCChart({ data }: PMCChartProps) {
    const [range, setRange] = useState<'30d' | '90d' | '180d' | 'all'>('90d');

    const filteredData = useMemo(() => {
        if (range === 'all') return data;

        const days = parseInt(range);
        if (data.length <= days) return data;

        return data.slice(data.length - days);
    }, [data, range]);

    return (
        <Card className="col-span-2">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Performance Management Chart (PMC)</CardTitle>
                        <CardDescription>
                            Fitness (CTL), Fatigue (ATL) & Form (TSB)
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                        {(['30d', '90d', '180d', 'all'] as const).map((r) => (
                            <Button
                                key={r}
                                variant={range === r ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setRange(r)}
                                className="h-7 text-xs px-3"
                            >
                                {r === 'all' ? 'All' : r.toUpperCase()}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCtl" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                minTickGap={50}
                                tick={{ fontSize: 12, fill: '#888' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                yAxisId="load"
                                label={{ value: 'Load', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                                tick={{ fontSize: 12, fill: '#888' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                yAxisId="form"
                                orientation="right"
                                label={{ value: 'Form', angle: 90, position: 'insideRight', style: { fill: '#888', fontSize: 12 } }}
                                tick={{ fontSize: 12, fill: '#888' }}
                                axisLine={false}
                                tickLine={false}
                            />

                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            {/* Reference Lines for TSB Zones */}
                            <ReferenceLine yAxisId="form" y={0} stroke="#666" strokeDasharray="3 3" strokeOpacity={0.3} />
                            <ReferenceLine yAxisId="form" y={-10} stroke="#f97316" strokeDasharray="3 3" strokeOpacity={0.2} />
                            <ReferenceLine yAxisId="form" y={-30} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.2} />

                            {/* Daily TSS Bars */}
                            <Bar
                                yAxisId="load"
                                dataKey="tss"
                                name="Daily Load"
                                fill="#94a3b8"
                                fillOpacity={0.2}
                                barSize={4}
                            />

                            {/* Fitness (CTL) - Area Chart */}
                            <Area
                                yAxisId="load"
                                type="monotone"
                                dataKey="ctl"
                                name="Fitness (CTL)"
                                stroke="#3b82f6"
                                fill="url(#colorCtl)"
                                strokeWidth={2}
                                animationDuration={500}
                            />

                            {/* Fatigue (ATL) - Line Chart */}
                            <Line
                                yAxisId="load"
                                type="monotone"
                                dataKey="atl"
                                name="Fatigue (ATL)"
                                stroke="#a855f7"
                                strokeWidth={2}
                                dot={false}
                                animationDuration={500}
                            />

                            {/* Form (TSB) - Line Chart */}
                            <Line
                                yAxisId="form"
                                type="monotone"
                                dataKey="tsb"
                                name="Form (TSB)"
                                stroke="#eab308"
                                strokeWidth={2}
                                dot={false}
                                animationDuration={500}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
