import { NextRequest, NextResponse } from 'next/server';
import { WorkoutGenerator } from '@/lib/ai/workout-generator';
import { WorkoutGenerationParams } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
    try {
        const params: WorkoutGenerationParams = await request.json();

        // Get API key from environment or user settings
        // For now, using environment variable
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key non configurata. Vai in Impostazioni per configurare Gemini API.' },
                { status: 400 }
            );
        }

        const generator = new WorkoutGenerator(apiKey, 'gemini');
        const workout = await generator.generate(params);

        return NextResponse.json(workout);
    } catch (error) {
        console.error('Error generating workout:', error);

        // Log the full error for debugging
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
        }

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Errore nella generazione del workout',
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
