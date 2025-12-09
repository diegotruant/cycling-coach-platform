import { NextRequest, NextResponse } from 'next/server';
import { MesocycleGenerator } from '@/lib/periodization/mesocycle-generator';

export async function POST(request: NextRequest) {
    try {
        const { athleteId, coachId, weeks, forceProtocol } = await request.json();

        if (!athleteId || !coachId) {
            return NextResponse.json(
                { error: 'athleteId e coachId sono richiesti' },
                { status: 400 }
            );
        }

        // Get API key from environment
        const apiKey = process.env.GEMINI_API_KEY;

        const generator = new MesocycleGenerator(apiKey);
        const mesocycle = await generator.generateMesocycle(athleteId, coachId, {
            weeks,
            forceProtocol
        });

        return NextResponse.json(mesocycle);
    } catch (error) {
        console.error('Error generating mesocycle:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Errore nella generazione del mesociclo' },
            { status: 500 }
        );
    }
}
