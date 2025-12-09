'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';

interface HRVTrendChartProps {
    data: {
        date: string;
        hrv: number;
        baseline: number;
        status: 'GREEN' | 'YELLOW' | 'RED';
    }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border border-border p-3 rounded-lg shadow-lg text-sm">
                <p className="font-semibold mb-1">{label}</p>
                <p className="text-primary">HRV: {payload[0].value} ms</p>
                <p className="text-muted-foreground">Baseline: {payload[1]?.value} ms</p>
            </div>
        );
    }
    return null;
};

export function HRVTrendChart({ data }: HRVTrendChartProps) {
    // Reverse data if it comes in desc order (we want asc for chart)
    const chartData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Trend HRV (30 Giorni)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(val) => {
                                    const d = new Date(val);
                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                }}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={['dataMin - 10', 'dataMax + 10']}
                            />
                            <Tooltip content={<CustomTooltip />} />

                            {/* Baseline Area */}
                            <Area
                                type="monotone"
                                dataKey="baseline"
                                stroke="#8884d8"
                                fillOpacity={1}
                                fill="url(#colorBaseline)"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                            />

                            {/* Daily HRV Line */}
                            <Line
                                type="monotone"
                                dataKey="hrv"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    const color = payload.status === 'GREEN' ? '#22c55e' : payload.status === 'YELLOW' ? '#eab308' : '#ef4444';
                                    return (
                                        <circle cx={cx} cy={cy} r={4} fill={color} stroke="none" key={payload.date} />
                                    );
                                }}
                                activeDot={{ r: 6 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
