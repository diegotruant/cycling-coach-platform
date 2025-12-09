import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { cleanRRIntervals } from '@/core/hrv/rr_cleaner';
import { calculateHRVMetrics } from '@/core/hrv/metrics';
import { calculateBaseline } from '@/core/hrv/baseline';
import { evaluateTrafficLight } from '@/core/hrv/status';
import { getAthleteDiary, saveAthleteDiaryEntry, updateAthleteTrends, getAthleteTrends } from '@/lib/storage';

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const athleteId = cookieStore.get('athlete_session')?.value;

    if (!athleteId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { rrIntervals, date } = body;

        if (!rrIntervals || !Array.isArray(rrIntervals)) {
            return NextResponse.json({ error: 'Invalid RR intervals' }, { status: 400 });
        }

        // 1. Clean Data
        const cleaningResult = cleanRRIntervals(rrIntervals);

        if (!cleaningResult.isValid) {
            return NextResponse.json({
                error: 'Poor signal quality',
                details: cleaningResult.warnings
            }, { status: 400 });
        }

        // 2. Calculate Metrics
        const metrics = calculateHRVMetrics(cleaningResult);
        if (!metrics) {
            return NextResponse.json({ error: 'Could not calculate metrics' }, { status: 500 });
        }

        // 3. Get History & Calculate Baseline
        const diary = await getAthleteDiary(athleteId);
        // Filter valid HRV entries and sort by date descending (assuming diary is sorted, but good to be safe or just take recent)
        // diary is usually sorted new to old in storage.ts implementation (unshift)
        const recentRMSSDs = diary
            .filter(e => e.hrv !== undefined)
            .map(e => e.hrv as number)
            .slice(0, 60); // Take last 60 entries for baseline calculation (though baseline func uses 7 by default)

        // We need to reverse because calculateBaseline expects chronological order? 
        // Actually calculateBaseline takes "last N values". If we pass [today-1, today-2...], slice(-7) takes the end.
        // Let's check calculateBaseline implementation:
        // "const recentValues = values.slice(-days);"
        // So it expects the array to be chronological (oldest -> newest).
        // Our diary is newest -> oldest.
        const chronologicalRMSSDs = recentRMSSDs.reverse();

        const baseline = calculateBaseline(chronologicalRMSSDs, 7);

        // 4. Evaluate Status
        const statusResult = evaluateTrafficLight(metrics.rmssd, baseline.mean);

        // 5. Save Data
        const entryDate = date || new Date().toISOString().split('T')[0];

        await saveAthleteDiaryEntry(athleteId, {
            date: entryDate,
            hrv: metrics.rmssd,
            hrr: metrics.heartRate, // Using HR as HRR proxy for now, or if HRR is separate
            trafficLight: statusResult.status,
            notes: statusResult.recommendation,
            sdnn: metrics.sdnn,
            pnn50: metrics.pnn50,
            cv: metrics.cv,
            meanRR: metrics.meanRR
        });

        // Update trends
        await updateAthleteTrends(athleteId, {
            baselineRMSSD: {
                mean: baseline.mean,
                stdDev: baseline.stdDev,
                days: baseline.count
            }
        });

        return NextResponse.json({
            success: true,
            metrics,
            status: statusResult,
            baseline: baseline.mean
        });

    } catch (error) {
        console.error('HRV Processing Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const athleteId = cookieStore.get('athlete_session')?.value;

    if (!athleteId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const diary = await getAthleteDiary(athleteId);
    const todayEntry = diary.find(e => e.date === today);

    if (todayEntry) {
        return NextResponse.json({
            hasData: true,
            status: todayEntry.trafficLight,
            hrv: todayEntry.hrv,
            recommendation: todayEntry.notes
        });
    }

    return NextResponse.json({ hasData: false });
}
