'use server';

import fs from 'fs/promises';
import path from 'path';

export interface TestResult {
    date: string;
    testType: string;
    avgPower: number;
    maxPower: number;
    duration: number; // minutes
    athleteCp?: number; // The athlete's Critical Power at the time of the test
    powerCurve: { time: number; power: number }[];
}

async function getAthleteTestResultsPath(athleteId: string): Promise<string> {
    const athletesDir = path.join(process.cwd(), 'data', 'Athletes');
    const entries = await fs.readdir(athletesDir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory() && entry.name.endsWith(`_${athleteId}`)) {
            return path.join(athletesDir, entry.name, 'test-results.json');
        }
    }

    throw new Error('Athlete directory not found');
}

export async function getTestResults(athleteId: string, testType: string): Promise<TestResult[]> {
    try {
        const resultsPath = await getAthleteTestResultsPath(athleteId);
        const data = await fs.readFile(resultsPath, 'utf-8');
        const allResults: TestResult[] = JSON.parse(data);

        // Filter by test type, ensure powerCurve exists, and sort by date descending
        return allResults
            .filter(r => r.testType === testType && r.powerCurve && r.powerCurve.length > 0)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
        // File doesn't exist yet or no results
        return [];
    }
}

export async function saveTestResult(athleteId: string, result: TestResult) {
    try {
        const resultsPath = await getAthleteTestResultsPath(athleteId);
        let allResults: TestResult[] = [];

        try {
            const data = await fs.readFile(resultsPath, 'utf-8');
            allResults = JSON.parse(data);
        } catch (e) {
            // File doesn't exist, start fresh
        }

        allResults.push(result);

        // Sort by date descending
        allResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        await fs.writeFile(resultsPath, JSON.stringify(allResults, null, 2));

        return { success: true };
    } catch (error) {
        console.error('Error saving test result:', error);
        return { success: false, error: 'Failed to save test result' };
    }
}

// Generate mock test results for demonstration
export async function generateMockTestResults(athleteId: string, testType: string) {
    const testNames: Record<string, number> = {
        'cp3': 3,
        'cp5': 5,
        'cp12': 12,
        'ramp': 25,
        'sprint': 5,
    };

    const duration = testNames[testType] || 20;
    const baseDate = new Date();

    // Generate 5 mock tests over last 3 months
    for (let i = 0; i < 5; i++) {
        const testDate = new Date(baseDate);
        testDate.setDate(testDate.getDate() - (i * 21)); // Every 3 weeks

        // Simulate improvement over time (older tests have lower power)
        const improvementFactor = 1 - (i * 0.03); // 3% decrease per test backwards
        const basePower = 250;
        const avgPower = Math.round(basePower * improvementFactor);
        const maxPower = Math.round(avgPower * 1.15);

        // Generate power curve
        const powerCurve: { time: number; power: number }[] = [];
        const totalSeconds = duration * 60;

        for (let sec = 0; sec <= totalSeconds; sec += 5) { // Every 5 seconds
            let power = avgPower;

            // Add some variation to make it realistic
            if (testType === 'ramp') {
                // Ramp test: increases over time
                power = Math.round(100 + (sec / totalSeconds) * (maxPower - 100));
            } else {
                // Steady state with some fluctuation
                const fluctuation = Math.sin(sec / 10) * 10;
                power = Math.round(avgPower + fluctuation);
            }

            powerCurve.push({ time: sec, power });
        }

        const result: TestResult = {
            date: testDate.toISOString(),
            testType,
            avgPower,
            maxPower,
            duration,
            powerCurve,
        };

        await saveTestResult(athleteId, result);
    }

    // Revalidate the page to show new data
    const { revalidatePath } = await import('next/cache');
    revalidatePath(`/athlete/test-center/${testType}`);

    return { success: true };
}
