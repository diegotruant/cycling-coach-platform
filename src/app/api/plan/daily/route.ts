import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAthlete, getAthleteDiary } from '@/lib/storage';
import { getDailyAdjustment } from '@/core/planner/adaptive_logic';
import { modulateWorkout } from '@/core/workouts/modulators';
import { WORKOUT_LIBRARY, WorkoutTemplate } from '@/core/workouts/library';

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const athleteId = cookieStore.get('athlete_session')?.value;

    if (!athleteId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const athlete = await getAthlete(athleteId);
        if (!athlete) {
            return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
        }

        const today = new Date().toISOString().split('T')[0];

        // 1. Get Today's Assignment
        const assignment = athlete.assignments?.find(a => a.date === today && a.status !== 'SKIPPED');

        // 2. Get Today's HRV Status
        const diary = await getAthleteDiary(athleteId);
        const todayEntry = diary.find(e => e.date === today);
        const hrvStatus = todayEntry?.trafficLight || 'GREEN'; // Default to Green if no data (or handle NO_DATA)

        let finalWorkout: WorkoutTemplate | null = null;
        let modificationReason = null;

        if (assignment) {
            // We have a manual assignment. Let's see if we need to modulate it.
            // First, try to find the full template from library if ID matches
            // If it's a custom workout not in library, we might struggle to modulate it structurally,
            // but we can wrap it.

            let baseTemplate: WorkoutTemplate;

            if (WORKOUT_LIBRARY[assignment.workoutId]) {
                baseTemplate = WORKOUT_LIBRARY[assignment.workoutId];
            } else {
                // Create a generic template wrapper for the assigned workout
                baseTemplate = {
                    id: assignment.workoutId,
                    name: assignment.workoutName,
                    type: 'Endurance', // Fallback
                    description: assignment.notes || 'Assigned by Coach',
                    intervals: [] // We might not have intervals for custom workouts yet
                } as any;
            }

            // Apply Adaptation
            const adjustment = getDailyAdjustment(hrvStatus);

            if (adjustment.action !== 'KEEP') {
                finalWorkout = modulateWorkout(baseTemplate, adjustment);
                modificationReason = adjustment.reason;
            } else {
                finalWorkout = baseTemplate;
            }
        } else {
            // No assignment. 
            // In future, "AI Workout Generator" would kick in here.
            // For now, return null or a rest day suggestion.
            return NextResponse.json({ message: 'No workout assigned for today' });
        }

        return NextResponse.json({
            workout: finalWorkout,
            hrvStatus,
            modification: modificationReason
        });

    } catch (error) {
        console.error('Daily Plan Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
