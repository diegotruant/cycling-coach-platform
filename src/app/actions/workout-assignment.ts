'use server';

import { getAthlete, updateAthlete } from '@/lib/storage';
import { TEST_PROTOCOLS } from '@/lib/workouts/protocols';
import { revalidatePath } from 'next/cache';
import { getRecoveryEntries } from './recovery';
import { calculateBaseline, calculateTrafficLight, analyzeOverreaching } from '@/lib/hrv-analysis';

export interface WorkoutAssignment {
    id: string;
    date: string;
    workoutId: string;
    workoutName: string;
    workoutStructure?: any;
    status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
    notes?: string;
    assignedBy?: string;
    assignedAt: string;
}

import { WORKOUT_LIBRARY } from '@/lib/workouts/library';

export async function assignWorkout(
    athleteId: string,
    workoutId: string,
    date: string,
    notes?: string,
    workoutStructure?: any
) {
    try {
        const athlete = await getAthlete(athleteId);
        if (!athlete) throw new Error('Athlete not found');

        // Find workout details
        let workoutName = 'Custom Workout';
        let foundStructure = workoutStructure;

        if (workoutId.startsWith('ai-')) {
            workoutName = workoutStructure?.name || 'AI Generated Workout';
        } else {
            // Search in library
            let protocol = null;
            for (const category of Object.values(WORKOUT_LIBRARY)) {
                const found = category.find(w => w.id === workoutId);
                if (found) {
                    protocol = found;
                    break;
                }
            }

            if (protocol) {
                workoutName = protocol.name;
                if (!foundStructure) {
                    foundStructure = protocol;
                }
            }
        }

        const newAssignment: WorkoutAssignment = {
            id: Math.random().toString(36).substr(2, 9),
            date,
            workoutId,
            workoutName,
            workoutStructure: foundStructure,
            status: 'PENDING',
            notes,
            assignedBy: 'COACH',
            assignedAt: new Date().toISOString(),
        };

        const assignments = athlete.assignments || [];
        assignments.push(newAssignment);

        // Sort by date
        assignments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        await updateAthlete(athleteId, { assignments });

        revalidatePath(`/coach/athletes/${athleteId}`);
        revalidatePath('/athlete');

        return { success: true, assignment: newAssignment };
    } catch (error) {
        console.error('Assign workout error:', error);
        return { success: false, error: 'Failed to assign workout' };
    }
}

export async function deleteAssignment(athleteId: string, assignmentId: string) {
    try {
        const athlete = await getAthlete(athleteId);
        if (!athlete) throw new Error('Athlete not found');

        const assignments = athlete.assignments?.filter(a => a.id !== assignmentId) || [];

        await updateAthlete(athleteId, { assignments });

        revalidatePath(`/coach/athletes/${athleteId}`);
        return { success: true };
    } catch (error) {
        console.error('Delete assignment error:', error);
        return { success: false, error: 'Failed to delete assignment' };
    }
}

export async function checkHRVForDate(athleteId: string, date: string) {
    // Only check if date is today
    const today = new Date().toISOString().split('T')[0];
    if (date !== today) return { status: 'OK' };

    const recoveryEntries = await getRecoveryEntries(athleteId);
    const latestEntry = recoveryEntries[0];

    if (!latestEntry || latestEntry.date !== today) {
        return { status: 'NO_DATA' };
    }

    if (latestEntry.hrv) {
        const recentHRV = recoveryEntries
            .filter(e => e.hrv && e.hrv > 0)
            .slice(0, 30)
            .map(e => e.hrv!);

        const baseline = calculateBaseline(recentHRV, 7);

        if (baseline.mean > 0) {
            const { status } = calculateTrafficLight(latestEntry.hrv, baseline.mean);

            // Check NFOR
            const overreaching = analyzeOverreaching(
                recoveryEntries.slice(0, 21).map(e => ({ date: e.date, hrv: e.hrv, rhr: e.rhr })),
                baseline.mean
            );

            if (overreaching.status === 'NFOR' || overreaching.status === 'FOR') {
                return { status: 'CRITICAL', reason: overreaching.status };
            }

            if (status === 'RED') {
                return { status: 'WARNING', reason: 'RED_HRV' };
            }
        }
    }

    return { status: 'OK' };
}
