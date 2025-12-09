'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { TrendingUp, Layers } from 'lucide-react';

interface TestResult {
    date: string;
    avgPower: number;
    maxPower: number;
    duration: number;
    powerCurve: { time: number; power: number }[];
}

interface TestResultsChartProps {
    testResults: TestResult[];
    testName: string;
    testType: string;
}

const COLORS = [
    '#10b981', // green-500
    '#3b82f6', // blue-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
];

export default function TestResultsChart({ testResults, testName, testType }: TestResultsChartProps) {
    const [viewMode, setViewMode] = useState<'latest' | 'all'>('latest');

    if (testResults.length === 0) {
        return null;
    }

    // Prepare data for chart
    const latestResult = testResults[0];
    const chartData = viewMode === 'latest'
        ? latestResult.powerCurve
        : prepareMultipleTestsData(testResults);

    return (
        <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">Power Curve Analysis</h2>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === 'latest' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('latest')}
                    >
                        Latest Only
                    </Button>
                    <Button
                        variant={viewMode === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('all')}
                    >
                        <Layers className="h-4 w-4 mr-2" />
                        All Tests ({testResults.length})
                    </Button>
                </div>
            </div>

            <div className="mb-4">
                {viewMode === 'latest' && (
                    <div className="text-sm text-muted-foreground">
                        Showing: <strong>{new Date(latestResult.date).toLocaleDateString()}</strong> |
                        Avg: <strong className="text-foreground">{latestResult.avgPower}W</strong> |
                        Max: <strong className="text-foreground">{latestResult.maxPower}W</strong>
                    </div>
                )}
                {viewMode === 'all' && (
                    <div className="text-sm text-muted-foreground">
                        Comparing {testResults.length} tests from{' '}
                        <strong>{new Date(testResults[testResults.length - 1].date).toLocaleDateString()}</strong> to{' '}
                        <strong>{new Date(testResults[0].date).toLocaleDateString()}</strong>
                    </div>
                )}
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                        dataKey="time"
                        label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
                        stroke="#9ca3af"
                    />
                    <YAxis
                        label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }}
                        stroke="#9ca3af"
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#f3f4f6' }}
                    />
                    <Legend />

                    {viewMode === 'latest' ? (
                        <Line
                            type="monotone"
                            dataKey="power"
                            stroke={COLORS[0]}
                            strokeWidth={2}
                            dot={false}
                            name="Power (W)"
                        />
                    ) : (
                        testResults.slice(0, 7).map((result, index) => (
                            <Line
                                key={result.date}
                                type="monotone"
                                dataKey={`power_${result.date}`}
                                stroke={COLORS[index % COLORS.length]}
                                strokeWidth={index === 0 ? 3 : 1.5}
                                opacity={index === 0 ? 1 : 0.6}
                                dot={false}
                                name={new Date(result.date).toLocaleDateString()}
                            />
                        ))
                    )}
                </LineChart>
            </ResponsiveContainer>

            {viewMode === 'all' && testResults.length > 7 && (
                <div className="mt-4 text-xs text-muted-foreground text-center">
                    Showing last 7 tests for clarity. View table below for complete history.
                </div>
            )}
        </div>
    );
}

// Helper function to prepare data for multiple tests overlay
function prepareMultipleTestsData(testResults: TestResult[]) {
    // Find the test with the most data points to use as base
    const maxLength = Math.max(...testResults.map(r => r.powerCurve.length));
    const baseTest = testResults.find(r => r.powerCurve.length === maxLength) || testResults[0];

    // Create data structure with all tests
    return baseTest.powerCurve.map((point, index) => {
        const dataPoint: any = { time: point.time };

        testResults.slice(0, 7).forEach((result) => {
            // Find closest time point in this test
            const closestPoint = result.powerCurve.reduce((prev, curr) => {
                return Math.abs(curr.time - point.time) < Math.abs(prev.time - point.time) ? curr : prev;
            });
            dataPoint[`power_${result.date}`] = closestPoint.power;
        });

        return dataPoint;
    });
}
