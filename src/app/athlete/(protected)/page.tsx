import { cookies } from "next/headers";
import { getAthleteDiary, getAthleteTrends, getActiveMesocycle, getTodaysWorkout } from "@/lib/storage";
import { getDailyAdjustment } from "@/core/planner/adaptive_logic";
import { modulateWorkout } from "@/core/workouts/modulators";
import { WORKOUT_LIBRARY, WorkoutTemplate } from "@/core/workouts/library";
import { AthleteDashboardClient } from "@/components/athlete/dashboard-client";

export const dynamic = 'force-dynamic';

import { getCurrentAthlete } from "@/lib/auth-helpers";

export default async function AthleteDashboard() {
    const athlete = await getCurrentAthlete();

    if (!athlete) {
        return <div>Not logged in or Athlete not found associated with this email.</div>;
    }
    const athleteId = athlete.id;

    // 1. Fetch Data
    const diary = await getAthleteDiary(athleteId);
    const trends = await getAthleteTrends(athleteId);
    const activeMesocycle = await getActiveMesocycle(athleteId);
    const todaysWorkout = await getTodaysWorkout(athleteId);

    const today = new Date().toISOString().split('T')[0];

    // 2. Process Today's Status
    const todayEntry = diary.find(e => e.date === today);
    const hrvStatus = todayEntry?.trafficLight || 'GREEN'; // Default/Fallback
    const currentHRV = todayEntry?.hrv || 0;
    const recommendation = todayEntry?.notes || (hrvStatus === 'GREEN' ? 'Ready to train.' : 'No data available.');

    // 3. Process Trends for Chart (Last 30 days)
    const trendData = diary
        .slice(0, 30)
        .map(e => ({
            date: e.date,
            hrv: e.hrv || 0,
            baseline: trends.baselineRMSSD?.mean || 0, // Simplified: using current baseline for all points
            status: e.trafficLight || 'GREEN'
        }))
        .filter(d => d.hrv > 0);

    // 4. Determine Today's Workout (Adaptive)
    let finalWorkout: WorkoutTemplate | null = null;
    let modificationReason: string | null = null;

    const assignment = athlete.assignments?.find(a => a.date === today && a.status !== 'SKIPPED');

    if (assignment) {
        let baseTemplate: WorkoutTemplate;
        if (WORKOUT_LIBRARY[assignment.workoutId]) {
            baseTemplate = WORKOUT_LIBRARY[assignment.workoutId];
        } else {
            baseTemplate = {
                id: assignment.workoutId,
                name: assignment.workoutName,
                type: 'ENDURANCE', // Fallback type
                description: assignment.notes || 'Assigned by Coach',
                intervals: []
            } as any;
        }

        const adjustment = getDailyAdjustment(hrvStatus);
        if (adjustment.action !== 'KEEP') {
            finalWorkout = modulateWorkout(baseTemplate, adjustment);
            modificationReason = adjustment.reason;
        } else {
            finalWorkout = baseTemplate;
        }
    }

    return (
        <AthleteDashboardClient
            athlete={athlete}
            hrvStatus={hrvStatus}
            currentHRV={currentHRV}
            recommendation={recommendation}
            trendData={trendData}
            finalWorkout={finalWorkout}
            modificationReason={modificationReason}
            todaysWorkout={todaysWorkout}
            activeMesocycle={activeMesocycle}
        />
    );
}
