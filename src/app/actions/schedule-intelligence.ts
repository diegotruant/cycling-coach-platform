'use server';

import { getAthlete, saveAthlete } from "@/lib/storage";
import { revalidatePath } from "next/cache";

export interface ScheduleHealthResult {
    status: 'OK' | 'ISSUES';
    issues: string[];
    suggestions: ScheduleSuggestion[];
}

export interface ScheduleSuggestion {
    id: string; // Unique ID for the suggestion
    type: 'MOVE' | 'DELETE';
    description: string;
    payload: any; // Data needed to execute the fix
}

export async function checkScheduleHealth(athleteId: string): Promise<ScheduleHealthResult> {
    const athlete = await getAthlete(athleteId);
    if (!athlete || !athlete.assignments) {
        return { status: 'OK', issues: [], suggestions: [] };
    }

    const today = new Date().toISOString().split('T')[0];
    const missedWorkouts = athlete.assignments.filter(
        a => a.date < today && a.status === 'PENDING'
    );

    if (missedWorkouts.length === 0) {
        return { status: 'OK', issues: ['Tutto in regola. Nessun allenamento saltato.'], suggestions: [] };
    }

    const suggestions: ScheduleSuggestion[] = [];
    const issues: string[] = [];

    // Simple Intelligence: Identify missed priority workouts
    missedWorkouts.forEach(workout => {
        // Assume 'VO2MAX' or 'THRESHOLD' or 'ANAEROBIC' in name/id implies high priority
        // For this MVP, we treat everything as "worth saving" but we can be smarter.

        issues.push(`Allenamento saltato: ${workout.workoutName} (${workout.date})`);

        // Find next empty slot in the next 7 days
        // (Simplified logic: finding first day with 0 assignments starting from tomorrow)
        // ideally we check for Rest Days.

        // For MVP: Suggest to DELETE simple ones (Endurance) and MOVE hard ones.
        const isHard = workout.workoutName.toLowerCase().includes('vo2') ||
            workout.workoutName.toLowerCase().includes('threshold') ||
            workout.workoutName.toLowerCase().includes('anaerobic') ||
            workout.workoutName.toLowerCase().includes('test');

        if (isHard) {
            suggestions.push({
                id: `move_${workout.id}`,
                type: 'MOVE',
                description: `Sposta "${workout.workoutName}" a domani (prioritario)`,
                payload: { assignmentId: workout.id, targetDate: getNextDay(today) }
            });
        } else {
            suggestions.push({
                id: `del_${workout.id}`,
                type: 'DELETE',
                description: `Rimuovi "${workout.workoutName}" (non prioritario)`,
                payload: { assignmentId: workout.id }
            });
        }
    });

    return {
        status: 'ISSUES',
        issues,
        suggestions
    };
}

export async function applyScheduleFix(athleteId: string, suggestion: ScheduleSuggestion) {
    const athlete = await getAthlete(athleteId);
    if (!athlete) throw new Error("Atleta non trovato");

    if (suggestion.type === 'DELETE') {
        athlete.assignments = (athlete.assignments || []).filter(a => a.id !== suggestion.payload.assignmentId);
    } else if (suggestion.type === 'MOVE') {
        const assignment = athlete.assignments?.find(a => a.id === suggestion.payload.assignmentId);
        if (assignment) {
            assignment.date = suggestion.payload.targetDate;
            // Should also check if there is a conflict on target date, but we overwrite/append for now.
        }
    }

    await saveAthlete(athlete);
    revalidatePath(`/coach/athletes/${athleteId}`);
    return { success: true };
}

function getNextDay(dateStr: string): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
}
