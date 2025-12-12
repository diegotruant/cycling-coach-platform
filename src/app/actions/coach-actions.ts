'use server';

import { getAthletes, createAthlete, deleteAthlete, AthleteConfig } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import { getRecoveryEntries } from './recovery';
import { getTestResults } from './test-results';
import { calculateBaseline, calculateTrafficLight, analyzeOverreaching } from '@/lib/hrv-analysis';

export interface AthleteWithStatus {
    id: string;
    name: string;
    email: string;

    // HRV Status
    currentHRV?: number;
    hrvStatus?: 'GREEN' | 'YELLOW' | 'RED';
    hrvDeviation?: number;
    baselineHRV?: number;
    overreachingStatus?: 'NORMAL' | 'WARNING' | 'FOR' | 'NFOR';

    // Performance Metrics
    ftp?: number;
    cp?: number;
    p_max?: number;
    w_prime?: number;

    // Activity
    lastActivity?: string;
    lastHRVDate?: string;
    lastTestDate?: string;
}

export interface CoachOverview {
    totalAthletes: number;
    hrvAlerts: {
        red: number;
        nfor: number;
        yellow: number;
    };
    recentTests: number; // Last 7 days
    recentUploads: number; // Last 7 days
}

export interface ActivityEntry {
    athleteId: string;
    athleteName: string;
    type: 'hrv' | 'test' | 'upload';
    date: string;
    details: string;
}

export async function getAthletesWithStatus(): Promise<AthleteWithStatus[]> {
    const athletes = await getAthletes();
    const athletesWithStatus: AthleteWithStatus[] = [];

    for (const athlete of athletes) {
        const recoveryEntries = await getRecoveryEntries(athlete.id);
        const latestEntry = recoveryEntries[0];

        let hrvStatus: 'GREEN' | 'YELLOW' | 'RED' | undefined;
        let hrvDeviation: number | undefined;
        let baselineHRV: number | undefined;
        let overreachingStatus: 'NORMAL' | 'WARNING' | 'FOR' | 'NFOR' | undefined;

        if (latestEntry?.hrv) {
            const recentHRV = recoveryEntries
                .filter(e => e.hrv && e.hrv > 0)
                .slice(0, 30)
                .map(e => e.hrv!);

            const baseline = calculateBaseline(recentHRV, 7);
            baselineHRV = baseline.mean;

            if (baseline.mean > 0) {
                const analysis = calculateTrafficLight(latestEntry.hrv, baseline.mean);
                hrvStatus = analysis.status;
                hrvDeviation = analysis.deviation;

                // Check for overreaching
                const overreaching = analyzeOverreaching(
                    recoveryEntries.slice(0, 21).map(e => ({
                        date: e.date,
                        hrv: e.hrv,
                        rhr: e.rhr
                    })),
                    baseline.mean
                );
                overreachingStatus = overreaching.status;
            }
        }

        // Get latest test date
        let lastTestDate: string | undefined;
        for (const testType of ['cp3', 'cp5', 'cp12', 'ramp', 'sprint']) {
            const results = await getTestResults(athlete.id, testType);
            if (results.length > 0 && (!lastTestDate || results[0].date > lastTestDate)) {
                lastTestDate = results[0].date;
            }
        }

        athletesWithStatus.push({
            id: athlete.id,
            name: athlete.name,
            email: athlete.email,
            currentHRV: latestEntry?.hrv,
            hrvStatus,
            hrvDeviation,
            baselineHRV,
            overreachingStatus,
            ftp: athlete.ftp,
            cp: athlete.cp,
            p_max: athlete.p_max,
            w_prime: athlete.w_prime,
            lastActivity: athlete.lastActivity,
            lastHRVDate: latestEntry?.date,
            lastTestDate,
        });
    }

    // Sort by HRV status priority (RED/NFOR first, then YELLOW, then GREEN)
    athletesWithStatus.sort((a, b) => {
        const priorityOrder = { 'NFOR': 0, 'RED': 1, 'YELLOW': 2, 'GREEN': 3 };
        const aPriority = a.overreachingStatus === 'NFOR' ? 0 :
            a.hrvStatus === 'RED' ? 1 :
                a.hrvStatus === 'YELLOW' ? 2 : 3;
        const bPriority = b.overreachingStatus === 'NFOR' ? 0 :
            b.hrvStatus === 'RED' ? 1 :
                b.hrvStatus === 'YELLOW' ? 2 : 3;
        return aPriority - bPriority;
    });

    return athletesWithStatus;
}

export async function getCoachOverview(): Promise<CoachOverview> {
    const athletesWithStatus = await getAthletesWithStatus();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let redCount = 0;
    let nforCount = 0;
    let yellowCount = 0;
    let recentTests = 0;

    for (const athlete of athletesWithStatus) {
        if (athlete.overreachingStatus === 'NFOR') nforCount++;
        else if (athlete.hrvStatus === 'RED') redCount++;
        else if (athlete.hrvStatus === 'YELLOW') yellowCount++;

        if (athlete.lastTestDate && new Date(athlete.lastTestDate) > sevenDaysAgo) {
            recentTests++;
        }
    }

    return {
        totalAthletes: athletesWithStatus.length,
        hrvAlerts: {
            red: redCount,
            nfor: nforCount,
            yellow: yellowCount,
        },
        recentTests,
        recentUploads: 0, // TODO: Implement when activity tracking is added
    };
}

export async function getHRVAlerts(): Promise<AthleteWithStatus[]> {
    const athletesWithStatus = await getAthletesWithStatus();

    return athletesWithStatus.filter(
        athlete =>
            athlete.overreachingStatus === 'NFOR' ||
            athlete.overreachingStatus === 'FOR' ||
            athlete.hrvStatus === 'RED'
    );
}

export async function getRecentActivity(): Promise<ActivityEntry[]> {
    const athletes = await getAthletes();
    const activities: ActivityEntry[] = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const athlete of athletes) {
        // HRV entries
        const recoveryEntries = await getRecoveryEntries(athlete.id);
        for (const entry of recoveryEntries.slice(0, 7)) {
            if (new Date(entry.date) > sevenDaysAgo && entry.hrv) {
                activities.push({
                    athleteId: athlete.id,
                    athleteName: athlete.name,
                    type: 'hrv',
                    date: entry.date,
                    details: `HRV: ${entry.hrv}ms ${entry.trafficLight ? `(${entry.trafficLight})` : ''}`,
                });
            }
        }

        // Test results
        for (const testType of ['cp3', 'cp5', 'cp12', 'ramp']) {
            const results = await getTestResults(athlete.id, testType);
            if (results.length > 0 && new Date(results[0].date) > sevenDaysAgo) {
                activities.push({
                    athleteId: athlete.id,
                    athleteName: athlete.name,
                    type: 'test',
                    date: results[0].date,
                    details: `${testType.toUpperCase()} test: ${results[0].avgPower}W avg`,
                });
            }
        }
    }

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return activities.slice(0, 20); // Return last 20 activities
}

export async function addAthlete(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (!name || !email) {
        throw new Error('Name and email are required');
    }

    const newAthlete: AthleteConfig = {
        id: crypto.randomUUID(),
        name,
        email,
        password: '123456',
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
    } as any; // Cast to any to avoid strict type checking for optional fields if needed, though AthleteConfig has mostly optionals

    await createAthlete(newAthlete);
    revalidatePath('/coach/athletes');
}

export async function deleteAthleteAction(athleteId: string) {
    try {
        await deleteAthlete(athleteId);
        revalidatePath('/coach/athletes');
    } catch (error) {
        console.error('Failed to delete athlete:', error);
        throw new Error('Failed to delete athlete');
    }
}

export async function archiveAthlete(athleteId: string): Promise<string> {
    const { updateAthlete, getAthleteFolderPath } = await import('@/lib/storage');
    const { exec } = await import('child_process');

    // Mark as archived
    await updateAthlete(athleteId, { status: 'ARCHIVED' });

    // Get folder path to return to the user
    const folderPath = await getAthleteFolderPath(athleteId);

    // Try to open the folder (Windows specific)
    try {
        // Use 'start' for Windows to open the folder
        // We need to handle spaces in path properly, usually by quoting
        // But 'start' treats the first quoted argument as window title, so we give it a dummy title
        const command = `start "" "${folderPath}"`;
        exec(command, (error) => {
            if (error) {
                console.error('Failed to open folder:', error);
            }
        });
    } catch (e) {
        console.error('Error attempting to open folder:', e);
    }

    revalidatePath('/coach/athletes');
    return folderPath;
}
