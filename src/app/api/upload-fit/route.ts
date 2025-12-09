import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseFitFile } from '@/lib/fit-parser';
import { calculateMMP, calculateCPandWprime, estimatePmax, PowerDurationPoint, calculateAPR, estimateVLAmax, determineRiderProfile, calculateNormalizedPower, calculateIF, calculateTSS } from '@/lib/physiology';
import { getAthlete, updateAthlete, AthleteConfig } from '@/lib/storage';

// Force rebuild - FIT file upload handler
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const testType = formData.get('testType') as string;

        // Get athlete ID from cookie
        const cookieStore = await cookies();
        const athleteId = cookieStore.get('athlete_session')?.value;

        if (!file) {
            return new NextResponse('No file uploaded', { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const activity = await parseFitFile(buffer);

        let message = `Processed activity. Avg Power: ${activity.avg_power}W`;
        let updatedMetrics = {};

        if (athleteId && testType !== 'NONE') {
            const athlete = await getAthlete(athleteId);
            if (athlete) {
                const updates: Partial<AthleteConfig> = {};

                // Extract relevant metric based on test type
                let testResultValue = activity.avg_power || 0;
                if (testType === 'CP3') {
                    const mmp3 = calculateMMP(activity.records, 180);
                    updates.best_3min = mmp3;
                    testResultValue = mmp3;
                    message += `. New CP3 Best: ${mmp3}W`;
                } else if (testType === 'CP5') {
                    const mmp5 = calculateMMP(activity.records, 300);
                    updates.best_5min = mmp5;
                    testResultValue = mmp5;
                    message += `. New CP5 Best: ${mmp5}W`;
                } else if (testType === 'CP12') {
                    const mmp12 = calculateMMP(activity.records, 720);
                    updates.best_12min = mmp12;
                    testResultValue = mmp12;
                    message += `. New CP12 Best: ${mmp12}W`;
                } else if (testType === 'SPRINT') {
                    const pmax = estimatePmax(activity.records);
                    updates.peak_power_1s = pmax;
                    updates.p_max = pmax;
                    testResultValue = pmax;
                    message += `. New Pmax: ${pmax}W`;
                } else if (testType === 'RAMP') {
                    if (activity.max_heart_rate) {
                        updates.maxHR = activity.max_heart_rate;
                        message += `. New Max HR: ${activity.max_heart_rate} bpm`;
                    }
                    // Ramp test can also be used to estimate MAP/FTP, but for now we focus on Max HR as requested
                    if (activity.max_power) {
                        updates.map = activity.max_power; // Peak power in ramp is often associated with MAP
                        testResultValue = activity.max_power;
                        message += `. New MAP: ${activity.max_power}W`;
                    }
                }

                // Merge with existing bests to try and recalculate CP/W'
                const currentBests = {
                    best_3min: updates.best_3min || athlete.best_3min,
                    best_5min: updates.best_5min || athlete.best_5min,
                    best_12min: updates.best_12min || athlete.best_12min,
                };

                const points: PowerDurationPoint[] = [];
                if (currentBests.best_3min) points.push({ duration: 180, watts: currentBests.best_3min });
                if (currentBests.best_5min) points.push({ duration: 300, watts: currentBests.best_5min });
                if (currentBests.best_12min) points.push({ duration: 720, watts: currentBests.best_12min });

                if (points.length >= 2) {
                    try {
                        const { cp, w_prime } = calculateCPandWprime(points);
                        updates.cp = cp;
                        updates.w_prime = w_prime;
                        updates.ftp = Math.round(cp * 0.96); // Estimate FTP as 96% of CP (common approximation)
                        message += `. Recalculated CP: ${cp}W, W': ${w_prime}J`;
                    } catch (e) {
                        console.warn("Could not recalculate CP", e);
                    }
                }

                // Recalculate Phenotype if we have Pmax and FTP
                const pmax = updates.p_max || athlete.p_max;
                const ftp = updates.ftp || athlete.ftp;
                const w_prime = updates.w_prime || athlete.w_prime;
                const cp = updates.cp || athlete.cp;

                if (pmax && ftp) {
                    const apr = calculateAPR(pmax, ftp);
                    updates.apr = apr;
                    message += `. APR: ${apr}W`;
                }

                if (pmax && cp) {
                    const vlamax = estimateVLAmax(pmax, cp);
                    updates.vlamax = vlamax;
                    message += `. VLaMax: ${vlamax} mmol/L/s`;
                }

                if (pmax && ftp && w_prime) {
                    const vlamax = updates.vlamax || athlete.vlamax;
                    const apr = updates.apr || athlete.apr;

                    updates.riderProfile = determineRiderProfile(pmax, ftp, w_prime, vlamax, apr);
                    message += `. Profile: ${updates.riderProfile}`;
                }

                // Update Athlete Metrics Power Curve (MMP Curve)
                // This ensures the Performance Dashboard chart is updated
                const existingPowerCurve = athlete.metrics?.powerCurve || [];
                const newPowerCurve = [...existingPowerCurve];
                const testDate = new Date(activity.timestamp).toISOString();

                const updateCurvePoint = (duration: number, watts: number) => {
                    const existingIndex = newPowerCurve.findIndex(p => p.duration === duration);
                    if (existingIndex >= 0) {
                        // Update if new power is higher
                        if (watts > newPowerCurve[existingIndex].watts) {
                            newPowerCurve[existingIndex] = { duration, watts, date: testDate };
                        }
                    } else {
                        newPowerCurve.push({ duration, watts, date: testDate });
                    }
                };

                if (testType === 'CP3' && updates.best_3min) {
                    updateCurvePoint(180, updates.best_3min);
                } else if (testType === 'CP5' && updates.best_5min) {
                    updateCurvePoint(300, updates.best_5min);
                } else if (testType === 'CP12' && updates.best_12min) {
                    updateCurvePoint(720, updates.best_12min);
                } else if (testType === 'SPRINT' && updates.peak_power_1s) {
                    updateCurvePoint(1, updates.peak_power_1s);
                }

                updates.metrics = {
                    ...athlete.metrics,
                    updatedAt: new Date().toISOString(),
                    cp: updates.cp || athlete.metrics?.cp,
                    wPrime: updates.w_prime || athlete.metrics?.wPrime,
                    pMax: updates.p_max || athlete.metrics?.pMax,
                    powerCurve: newPowerCurve
                };

                // Calculate Activity Metrics (TSS, NP, IF) for PMC
                const durationSec = activity.total_timer_time || 0;
                const currentFtp = updates.ftp || athlete.ftp || 200; // Use new FTP if available, else current, else default
                const np = calculateNormalizedPower(activity.records);
                const if_factor = calculateIF(np, currentFtp);
                const tss = calculateTSS(durationSec, np, if_factor, currentFtp);

                // Create or Update Assignment
                const assignments = athlete.assignments || [];
                const testDateStr = new Date(activity.timestamp).toISOString().split('T')[0];

                // Check if there's already a pending assignment for this test on this day
                const pendingIndex = assignments.findIndex(a =>
                    a.date === testDateStr &&
                    (a.workoutId === `test-${testType.toLowerCase()}` || a.workoutName.toLowerCase().includes(testType.toLowerCase()))
                );

                const activityData = {
                    duration: durationSec,
                    distance: activity.total_distance || 0,
                    tss,
                    if: if_factor,
                    np,
                    avgPower: activity.avg_power || 0,
                    avgHr: activity.avg_heart_rate,
                    calories: undefined, // Not available in parsed data usually, unless calculated
                    elevationGain: undefined
                };

                if (pendingIndex >= 0) {
                    // Update existing assignment
                    assignments[pendingIndex] = {
                        ...assignments[pendingIndex],
                        status: 'COMPLETED',
                        activityData
                    };
                } else {
                    // Create new assignment
                    assignments.push({
                        id: `test-${testType.toLowerCase()}-${Date.now()}`,
                        date: testDateStr,
                        workoutId: `test-${testType.toLowerCase()}`,
                        workoutName: `${testType} Test`,
                        status: 'COMPLETED',
                        assignedBy: 'SYSTEM',
                        assignedAt: new Date().toISOString(),
                        activityData
                    });
                }
                updates.assignments = assignments;

                await updateAthlete(athleteId, updates);
                updatedMetrics = updates;

                // Save Test Result to History (for Charts)
                try {
                    const { saveTestResult } = await import('@/app/actions/test-results');

                    // Construct power curve (downsample if needed to save space)
                    // We'll take one point every 5 seconds
                    const powerCurve = [];
                    if (activity.records && activity.records.length > 0) {
                        console.log(`[Upload] Found ${activity.records.length} records. Processing...`);

                        // Use the first record's timestamp as the start time (t=0)
                        // This is more reliable than session.timestamp which might be end time or skewed
                        const startTime = new Date(activity.records[0].timestamp).getTime();
                        console.log(`[Upload] Using start time from first record: ${new Date(startTime).toISOString()}`);

                        for (let i = 0; i < activity.records.length; i += 5) {
                            const record = activity.records[i];
                            // Check for power in various possible fields
                            const r = record as any;
                            const power = typeof r.power === 'number' ? r.power :
                                typeof r.watts === 'number' ? r.watts :
                                    undefined;

                            if (record && power !== undefined) {
                                // Calculate time in seconds from start
                                const recordTime = new Date(record.timestamp).getTime();
                                const time = Math.round((recordTime - startTime) / 1000);

                                // Only add points with non-negative time (sanity check)
                                if (time >= 0) {
                                    powerCurve.push({ time, power });
                                }
                            }
                        }
                        console.log(`[Upload] Extracted ${powerCurve.length} points for power curve.`);
                    } else {
                        console.warn("[Upload] No records found in activity object.");
                    }

                    await saveTestResult(athleteId, {
                        date: new Date(activity.timestamp).toISOString(),
                        testType: testType.toLowerCase(), // 'cp3', 'cp5', etc.
                        avgPower: testResultValue,
                        maxPower: activity.max_power || 0,
                        duration: Math.round((activity.total_timer_time || 0) / 60), // minutes
                        athleteCp: updates.cp || athlete.cp,
                        powerCurve
                    });
                } catch (e) {
                    console.error("Failed to save test result history:", e);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message,
            data: {
                timestamp: activity.timestamp,
                avg_power: activity.avg_power,
                max_power: activity.max_power,
                ...updatedMetrics
            }
        });

    } catch (error) {
        console.error('Error processing FIT file:', error);
        return new NextResponse('Error processing file', { status: 500 });
    }
}
