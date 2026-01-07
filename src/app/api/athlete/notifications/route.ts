import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAthlete } from '@/lib/storage';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const athleteId = cookieStore.get('athlete_session')?.value;

        if (!athleteId) {
            return NextResponse.json({ notifications: [], unreadCount: 0 });
        }

        const athlete = await getAthlete(athleteId);
        if (!athlete) {
            return NextResponse.json({ notifications: [], unreadCount: 0 });
        }

        // Generate notifications based on athlete state
        const notifications = [];

        // Check for new mesocycle
        const activeMesocycle = athlete.mesocycles?.find(m => m.status === 'ACTIVE');
        if (activeMesocycle) {
            const startDate = new Date(activeMesocycle.startDate);
            const now = new Date();
            // If started in last 24 hours
            if (now.getTime() - startDate.getTime() < 86400000) {
                notifications.push({
                    id: 'new_mesocycle',
                    title: 'Nuovo Piano di Allenamento',
                    message: `Il tuo coach ha attivato il mesociclo: ${activeMesocycle.name}`,
                    createdAt: activeMesocycle.createdAt,
                    read: false
                });
            }
        }

        // Check for today's workout
        const today = new Date().toISOString().split('T')[0];
        const todaysWorkout = athlete.assignments?.find(a => a.date === today && a.status === 'PENDING');
        if (todaysWorkout) {
            notifications.push({
                id: `workout_${today}`,
                title: 'Allenamento di Oggi',
                message: `Hai un allenamento programmato: ${todaysWorkout.workoutName}`,
                createdAt: new Date().toISOString(),
                read: false
            });
        }

        return NextResponse.json({
            notifications,
            unreadCount: notifications.length
        });
    } catch (error) {
        return NextResponse.json({ notifications: [], unreadCount: 0 });
    }
}
