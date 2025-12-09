import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { TEST_PROTOCOLS } from "@/lib/workouts/protocols";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import TestResultsChart from "@/components/test-results-chart";
import { getTestResults } from "@/app/actions/test-results";

export default async function TestDetailPage({ params }: { params: Promise<{ testId: string }> }) {
    const cookieStore = await cookies();
    const athleteId = cookieStore.get('athlete_session')?.value;

    if (!athleteId) {
        return <div>Not logged in</div>;
    }

    const { testId: testIdParam } = await params;
    const testId = `test-${testIdParam}`;
    const protocol = Object.values(TEST_PROTOCOLS).find(p => p.id === testId);

    if (!protocol) {
        notFound();
    }

    // Fetch historical test results for this athlete and test type
    const testResults = await getTestResults(athleteId, testIdParam);

    return (
        <div className="space-y-8 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/athlete/test-center">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Tests
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{protocol.name}</h1>
                        <p className="text-muted-foreground mt-1">{protocol.description}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <a href={`/api/download-workout?type=${testIdParam.toUpperCase()}&format=zwo`}>
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download .ZWO
                        </Button>
                    </a>
                    <a href={`/api/download-workout?type=${testIdParam.toUpperCase()}&format=erg`}>
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download .ERG
                        </Button>
                    </a>
                </div>
            </div>

            {/* Test Results Chart with Toggle */}
            <TestResultsChart
                testResults={testResults}
                testName={protocol.name}
                testType={testIdParam}
            />

            {/* Historical Results Table */}
            {testResults.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="h-5 w-5" />
                        <h2 className="text-xl font-semibold">Test History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left p-3 font-semibold">Date</th>
                                    <th className="text-left p-3 font-semibold">{testIdParam.toUpperCase()} Power</th>
                                    <th className="text-left p-3 font-semibold">Max Power</th>
                                    <th className="text-left p-3 font-semibold">Duration</th>
                                    <th className="text-left p-3 font-semibold">Improvement</th>
                                </tr>
                            </thead>
                            <tbody>
                                {testResults.map((result, index) => {
                                    const previousResult = testResults[index + 1];
                                    const improvement = previousResult
                                        ? ((result.avgPower - previousResult.avgPower) / previousResult.avgPower * 100).toFixed(1)
                                        : null;

                                    return (
                                        <tr key={`${result.date}-${index}`} className="border-b border-border/50 hover:bg-accent/50">
                                            <td className="p-3">{new Date(result.date).toLocaleDateString()}</td>
                                            <td className="p-3 font-semibold">{result.avgPower}W</td>
                                            <td className="p-3">{result.maxPower}W</td>
                                            <td className="p-3">{result.duration}min</td>
                                            <td className="p-3">
                                                {improvement !== null && (
                                                    <span className={`font-semibold ${parseFloat(improvement) > 0 ? 'text-green-500' : 'text-red-500'
                                                        }`}>
                                                        {parseFloat(improvement) > 0 ? '+' : ''}{improvement}%
                                                    </span>
                                                )}
                                                {improvement === null && (
                                                    <span className="text-muted-foreground text-sm">First test</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {testResults.length === 0 && (
                <div className="rounded-xl border border-border bg-card p-12 text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold mb-2">No Test Results Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Complete this test and upload your .fit file to see your power curve and track progress over time.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Link href="/athlete/upload">
                            <Button>Upload Test Results</Button>
                        </Link>
                        <form action={async () => {
                            'use server';
                            const { generateMockTestResults } = await import('@/app/actions/test-results');
                            await generateMockTestResults(athleteId, testIdParam);
                        }}>
                            <Button type="submit" variant="outline">
                                🎲 Generate Mock Data (Demo)
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
