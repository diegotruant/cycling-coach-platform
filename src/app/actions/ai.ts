'use server';

import { generateWorkout, GenerateWorkoutParams } from "@/lib/ai/gemini";

export async function generateAIWorkoutAction(params: GenerateWorkoutParams) {
    try {
        const workout = await generateWorkout(params);
        return { success: true, workout };
    } catch (error) {
        console.error("AI Action Error:", error);
        return { success: false, error: "Failed to generate workout" };
    }
}
