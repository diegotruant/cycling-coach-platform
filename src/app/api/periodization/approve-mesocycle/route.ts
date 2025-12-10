import { NextRequest, NextResponse } from 'next/server';
import { saveMesocycle, assignWorkoutsFromMesocycle } from '@/lib/storage';

export async function POST(request: NextRequest) {
    try {
        const { mesocycle, athleteId, coachId, coachNotes } = await request.json();

        if (!mesocycle || !athleteId || !coachId) {
            return NextResponse.json(
                { error: 'mesocycle, athleteId e coachId sono richiesti' },
                { status: 400 }
            );
        }

        // Update mesocycle with approval info
        const approvedMesocycle = {
            ...mesocycle,
            status: 'APPROVED',
            approvedBy: coachId,
            approvedAt: new Date().toISOString(),
            coachNotes: coachNotes || mesocycle.coachNotes
        };

        // Save mesocycle
        await saveMesocycle(athleteId, approvedMesocycle);

        // Assign workouts to athlete
        await assignWorkoutsFromMesocycle(athleteId, approvedMesocycle, coachId);

        return NextResponse.json({
            success: true,
            message: 'Mesociclo approvato e workout assegnati',
            mesocycle: approvedMesocycle
        });
    } catch (error) {
        console.error('Error approving mesocycle:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Errore nell\'approvazione del mesociclo' },
            { status: 500 }
        );
    }
}
