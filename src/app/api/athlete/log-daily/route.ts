import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveAthleteDiaryEntry } from '@/lib/storage';

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const athleteId = cookieStore.get('athlete_session')?.value;

        if (!athleteId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        await saveAthleteDiaryEntry(athleteId, {
            date: data.date,
            hrv: parseInt(data.hrv),
            hrr: parseInt(data.hrr),
            trafficLight: data.trafficLight,
            notes: data.notes,
            sleepQuality: data.sleepQuality,
            sleepDuration: data.sleepDuration,
            fatigue: data.fatigue,
            stress: data.stress,
            soreness: data.soreness
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error logging daily data:', error);
        return NextResponse.json(
            { error: 'Error logging data' },
            { status: 500 }
        );
    }
}
