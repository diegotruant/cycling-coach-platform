'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PMCDataPoint } from "@/lib/physiology/pmc";
import { AthleteConfig } from "@/lib/storage";

interface LoadSummaryCardProps {
    pmcData: PMCDataPoint[];
    assignments: AthleteConfig['assignments'];
}

export function LoadSummaryCard({ pmcData, assignments }: LoadSummaryCardProps) {
    if (!pmcData || pmcData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Training Load Summary</CardTitle>
                    <CardDescription>Weekly and monthly training load breakdown</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                    No training data available
                </CardContent>
            </Card>
        );
    }

    // Calculate weekly loads for last 4 weeks
    const today = new Date();
    const weeklyData = [];

    for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (i * 7) - 6);
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() - (i * 7));

        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];

        const weekLoad = pmcData
            .filter(d => d.date >= weekStartStr && d.date <= weekEndStr)
            .reduce((sum, d) => sum + d.tss, 0);

        weeklyData.push({
            week: i === 0 ? 'This Week' : `${i + 1}w ago`,
            tss: Math.round(weekLoad),
            label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        });
    }

    // Calculate load by activity type
    const activityTypeLoad: { [key: string]: number } = {};
    (assignments || [])
        .filter(a => a.status === 'COMPLETED' && a.activityData)
        .forEach(a => {
            const type = a.workoutName;
            activityTypeLoad[type] = (activityTypeLoad[type] || 0) + (a.activityData?.tss || 0);
        });

    const topActivityTypes = Object.entries(activityTypeLoad)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Calculate monthly stats
    const last28Days = pmcData.slice(-28);
    const totalLoad = last28Days.reduce((sum, d) => sum + d.tss, 0);
    const avgDailyLoad = Math.round(totalLoad / 28);
    const trainingDays = last28Days.filter(d => d.tss > 0).length;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Training Load Summary</CardTitle>
                <CardDescription>Weekly breakdown and activity distribution</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{totalLoad}</div>
                            <div className="text-xs text-muted-foreground">28-day TSS</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{avgDailyLoad}</div>
                            <div className="text-xs text-muted-foreground">Avg Daily TSS</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{trainingDays}</div>
                            <div className="text-xs text-muted-foreground">Training Days</div>
                        </div>
                    </div>

                    {/* Weekly Load Chart */}
                    <div>
                        <h4 className="font-semibold text-sm mb-3">Weekly Load Trend</h4>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis
                                        dataKey="week"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value: any) => [`${value} TSS`, 'Load']}
                                        labelFormatter={(label, payload) => {
                                            if (payload && payload[0]) {
                                                return payload[0].payload.label;
                                            }
                                            return label;
                                        }}
                                    />
                                    <Bar dataKey="tss" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Activity Types */}
                    {topActivityTypes.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-sm mb-3">Load by Activity Type</h4>
                            <div className="space-y-2">
                                {topActivityTypes.map(([type, tss], index) => {
                                    const percentage = (tss / totalLoad) * 100;
                                    return (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="w-32 text-xs font-medium truncate">
                                                {type}
                                            </div>
                                            <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <div className="w-20 text-right text-xs font-mono">
                                                {Math.round(tss)} TSS
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
