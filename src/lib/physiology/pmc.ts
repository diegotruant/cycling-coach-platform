import { AthleteConfig } from "@/lib/storage";

export interface PMCDataPoint {
    date: string;
    ctl: number; // Fitness
    atl: number; // Fatigue
    tsb: number; // Form
    tss: number; // Daily Load
}

export function calculatePMC(assignments: AthleteConfig['assignments'], daysToLookBack: number = 90): PMCDataPoint[] {
    if (!assignments || assignments.length === 0) return [];

    // 1. Create a map of daily TSS
    const tssMap = new Map<string, number>();
    assignments.forEach(a => {
        if (a.status === 'COMPLETED' && a.activityData?.tss) {
            const current = tssMap.get(a.date) || 0;
            tssMap.set(a.date, current + a.activityData.tss);
        }
    });

    // 2. Determine date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToLookBack);

    // We need to start calculating from the very first activity to get accurate CTL/ATL, 
    // but for performance we might simulate or start earlier if history is long.
    // For now, let's find the earliest activity.
    const earliestActivity = assignments.reduce((min, a) => {
        const d = new Date(a.date);
        return d < min ? d : min;
    }, new Date());

    // Start calculation from earliest activity or (startDate - 60 days) to build up values
    const calcDate = new Date(earliestActivity);
    if (calcDate > startDate) {
        // If earliest activity is after start date, just start from there
        // But we usually want to show the graph from startDate.
        // So we start calc from earliest, and filter output later.
    } else {
        // If earliest is way back, great.
    }

    // Constants
    const CTL_TC = 42; // Time constant for Fitness
    const ATL_TC = 7;  // Time constant for Fatigue

    const kCTL = 1 / CTL_TC; // Actually exp(-1/42) is more accurate but 1/42 is common approximation for EWMA
    // Standard Coggan formula: Today = Yesterday + (TSS - Yesterday) * (1/TC)

    let ctl = 0;
    let atl = 0;

    const pmcData: PMCDataPoint[] = [];

    // Iterate from earliest activity to today + 7 days (forecast)
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);

    // Ensure we start at least 42 days before startDate to have somewhat stable values if possible
    // But if no data exists, it starts at 0.

    // Let's iterate day by day
    const currentDate = new Date(calcDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const tss = tssMap.get(dateStr) || 0;

        ctl = ctl + (tss - ctl) / CTL_TC;
        atl = atl + (tss - atl) / ATL_TC;
        const tsb = ctl - atl;

        // Only push to output if within requested range
        if (currentDate >= startDate) {
            pmcData.push({
                date: dateStr,
                ctl: Math.round(ctl * 10) / 10,
                atl: Math.round(atl * 10) / 10,
                tsb: Math.round(tsb * 10) / 10,
                tss
            });
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return pmcData;
}

// Helper to generate mock data for testing
export function generateMockPMCData(athleteId: string, ftp: number = 250): NonNullable<AthleteConfig['assignments']> {
    const assignments: NonNullable<AthleteConfig['assignments']> = [];
    const today = new Date();

    // Activity types with different characteristics
    const activityTypes = [
        { name: 'Recovery Ride', tssRange: [20, 40], ifRange: [0.45, 0.60], durationRange: [1800, 3600], weight: 0.15 },
        { name: 'Endurance Ride', tssRange: [60, 100], ifRange: [0.65, 0.75], durationRange: [5400, 10800], weight: 0.40 },
        { name: 'Tempo Intervals', tssRange: [70, 110], ifRange: [0.75, 0.85], durationRange: [3600, 5400], weight: 0.20 },
        { name: 'VO2 Max Intervals', tssRange: [80, 120], ifRange: [0.85, 0.95], durationRange: [2700, 4500], weight: 0.15 },
        { name: 'Sweet Spot', tssRange: [75, 105], ifRange: [0.80, 0.90], durationRange: [3600, 5400], weight: 0.08 },
        { name: 'Race', tssRange: [120, 200], ifRange: [0.85, 1.05], durationRange: [5400, 14400], weight: 0.02 }
    ];

    // Generate 90 days of history
    for (let i = 90; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Rest days (30% chance)
        const isRestDay = Math.random() > 0.7;

        if (!isRestDay) {
            // Select activity type based on weights
            const rand = Math.random();
            let cumWeight = 0;
            let selectedType = activityTypes[0];

            for (const type of activityTypes) {
                cumWeight += type.weight;
                if (rand <= cumWeight) {
                    selectedType = type;
                    break;
                }
            }

            // Generate metrics
            const duration = Math.floor(
                selectedType.durationRange[0] +
                Math.random() * (selectedType.durationRange[1] - selectedType.durationRange[0])
            );

            const intensityFactor =
                selectedType.ifRange[0] +
                Math.random() * (selectedType.ifRange[1] - selectedType.ifRange[0]);

            const normalizedPower = Math.round(ftp * intensityFactor);
            const avgPower = Math.round(normalizedPower * (0.85 + Math.random() * 0.15));

            const tss = Math.round(
                (duration / 3600) * intensityFactor * intensityFactor * 100
            );

            const distance = Math.round((duration / 3600) * (25000 + Math.random() * 10000)); // 25-35 km/h
            const elevationGain = Math.round(distance / 100 * (5 + Math.random() * 15)); // 5-20m per km
            const calories = Math.round(duration / 3600 * avgPower * 3.6);

            assignments.push({
                id: `mock-${dateStr}`,
                date: dateStr,
                workoutId: `mock-${selectedType.name.toLowerCase().replace(/\s/g, '-')}`,
                workoutName: selectedType.name,
                status: 'COMPLETED',
                assignedAt: new Date().toISOString(),
                activityData: {
                    duration,
                    distance,
                    tss,
                    if: Math.round(intensityFactor * 100) / 100,
                    np: normalizedPower,
                    avgPower,
                    avgHr: Math.round(140 + Math.random() * 40), // 140-180 bpm
                    calories,
                    elevationGain
                }
            });
        }
    }
    return assignments;
}

// Generate realistic power curve data
export function generateMockPowerCurve(ftp: number = 250): Array<{ duration: number; watts: number; date: string }> {
    const today = new Date();
    const powerCurve: Array<{ duration: number; watts: number; date: string }> = [];

    // Key durations in seconds
    const durations = [
        5,      // 5 seconds
        10,     // 10 seconds
        30,     // 30 seconds
        60,     // 1 minute
        120,    // 2 minutes
        300,    // 5 minutes
        600,    // 10 minutes
        1200,   // 20 minutes
        3600    // 60 minutes
    ];

    // Realistic power curve based on FTP
    // These are approximate multipliers based on typical power profiles
    const multipliers: { [key: number]: number } = {
        5: 3.0,      // ~750W for 250 FTP
        10: 2.6,     // ~650W
        30: 2.2,     // ~550W
        60: 1.9,     // ~475W
        120: 1.6,    // ~400W
        300: 1.35,   // ~338W (VO2max)
        600: 1.15,   // ~288W
        1200: 1.0,   // ~250W (FTP)
        3600: 0.85   // ~213W
    };

    durations.forEach(duration => {
        const baseWatts = ftp * multipliers[duration];
        // Add some variation (±5%)
        const watts = Math.round(baseWatts * (0.95 + Math.random() * 0.10));

        // Random date within last 90 days
        const daysAgo = Math.floor(Math.random() * 90);
        const date = new Date(today);
        date.setDate(today.getDate() - daysAgo);

        powerCurve.push({
            duration,
            watts,
            date: date.toISOString().split('T')[0]
        });
    });

    return powerCurve;
}
