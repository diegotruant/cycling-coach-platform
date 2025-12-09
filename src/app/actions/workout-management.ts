'use server';

import { getAthlete, saveAthlete } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import { WORKOUT_LIBRARY } from "@/lib/workouts/library";

// Helper to find workout by ID flattened
function findWorkoutById(id: string) {
    for (const category of Object.values(WORKOUT_LIBRARY)) {
        const found = category.find(w => w.id === id);
        if (found) return found;
    }
    return null;
}

export async function assignWorkout(athleteId: string, workoutId: string, date: string) {
    try {
        const athlete = await getAthlete(athleteId);
        if (!athlete) throw new Error('Atleta non trovato');

        const workout = findWorkoutById(workoutId);
        if (!workout) throw new Error('Workout non trovato');

        const assignment = {
            id: crypto.randomUUID(),
            date: date,
            workoutId: workout.id,
            workoutName: workout.name,
            workoutStructure: workout,
            status: 'PENDING' as const,
            assignedBy: 'COACH',
            assignedAt: new Date().toISOString()
        };

        if (!athlete.assignments) athlete.assignments = [];
        athlete.assignments.push(assignment);

        await saveAthlete(athlete);
        revalidatePath(`/coach/athletes/${athleteId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to assign workout:', error);
        return { success: false, error: 'Errore durante l\'assegnazione' };
    }
}

export async function deleteWorkoutAssignment(athleteId: string, assignmentId: string) {

    try {
        const athlete = await getAthlete(athleteId);
        if (!athlete) throw new Error('Atleta non trovato');

        const initialLength = athlete.assignments?.length || 0;
        athlete.assignments = (athlete.assignments || []).filter(a => a.id !== assignmentId);

        if (athlete.assignments.length === initialLength) {
            return { success: false, error: 'Assegnazione non trovata' };
        }

        await saveAthlete(athlete);
        revalidatePath(`/coach/athletes/${athleteId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to delete assignment:', error);
        return { success: false, error: 'Errore durante l\'eliminazione' };
    }
}
