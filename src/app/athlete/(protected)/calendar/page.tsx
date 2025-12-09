import { cookies } from "next/headers";
import { getAthlete } from "@/lib/storage";
import { CalendarPageClient } from "@/components/calendar/calendar-page-client";
import { CalendarEvent } from "@/components/calendar/calendar-view";

export default async function AthleteCalendarPage() {
    const cookieStore = await cookies();
    const athleteId = cookieStore.get('athlete_session')?.value;

    if (!athleteId) return <div>Not logged in</div>;

    const athlete = await getAthlete(athleteId);
    if (!athlete) return <div>Athlete not found</div>;

    // Map assignments to calendar events
    const events: CalendarEvent[] = (athlete.assignments || []).map(a => ({
        id: a.id, // Use assignment ID
        date: a.date,
        title: a.workoutName,
        type: 'WORKOUT',
        status: a.status,
        description: a.notes,
        details: a.workoutStructure
    }));

    return (
        <div className="space-y-6 p-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Training Calendar</h1>
                    <p className="text-muted-foreground">View your past and upcoming workouts.</p>
                </div>
            </div>

            <div className="flex-1">
                <CalendarPageClient events={events} athleteFtp={athlete.ftp || 200} athleteId={athleteId} isCoach={false} />
            </div>
        </div>
    );
}
