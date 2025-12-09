
import { getAthlete, saveAthlete } from '../lib/storage';

async function main() {
    // ID from list_dir output
    const athleteId = 'test-marco.rossi-1764281986229';
    const athlete = await getAthlete(athleteId);

    if (!athlete) {
        console.error('Marco Rossi not found');
        return;
    }

    console.log(`Found athlete: ${athlete.name}`);

    // Clear existing assignments for clarity
    athlete.assignments = [];

    const today = new Date();

    // Create a "Bad Week" simulation
    // 1. Missed High Intensity (3 days ago)
    const date1 = new Date(today);
    date1.setDate(today.getDate() - 3);

    athlete.assignments.push({
        id: 'missed-vo2max',
        date: date1.toISOString().split('T')[0],
        workoutId: 'vo2max-intervals',
        workoutName: 'VO2 Max Intervals',
        status: 'SKIPPED',
        notes: 'Too tired'
    });

    // 2. Missed Tempo (2 days ago)
    const date2 = new Date(today);
    date2.setDate(today.getDate() - 2);

    athlete.assignments.push({
        id: 'missed-tempo',
        date: date2.toISOString().split('T')[0],
        workoutId: 'tempo-2x20',
        workoutName: 'Tempo 2x20m',
        status: 'PENDING', // Pending in past = missed
    });

    // 3. Upcoming workout (Tomorrow) - existing plan
    const date3 = new Date(today);
    date3.setDate(today.getDate() + 1);

    athlete.assignments.push({
        id: 'upcoming-endurance',
        date: date3.toISOString().split('T')[0],
        workoutId: 'endurance-long',
        workoutName: 'Endurance Long Ride',
        status: 'PENDING'
    });

    await saveAthlete(athlete);
    console.log('Simulated "Bad Week" for Marco Rossi.');
}

main().catch(console.error);
