import { getAthletes } from "@/lib/storage";
import { CoachScheduleClient, CoachScheduleEvent } from "@/components/coach/schedule-client";

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
    const athletes = await getAthletes();

    const allEvents: CoachScheduleEvent[] = athletes.flatMap(athlete =>
        (athlete.assignments || []).map(assignment => ({
            id: assignment.id,
            athleteId: athlete.id,
            athleteName: `${athlete.name}`, // Fixed: AthleteConfig has 'name', no first/last split in older definitions? Let's check storage.ts
            date: assignment.date,
            title: assignment.workoutName,
            status: assignment.status as 'PENDING' | 'COMPLETED' | 'SKIPPED' | undefined,
            description: assignment.notes
        }))
    );

    return (
        <CoachScheduleClient events={allEvents} />
    );
}
