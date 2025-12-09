
export type WorkoutType = 'CP3' | 'CP5' | 'CP12' | 'RAMP' | 'SPRINT';

export interface WorkoutStep {
    type: 'WARMUP' | 'ACTIVE' | 'REST' | 'COOLDOWN' | 'RAMP';
    duration: number; // seconds
    power: number | { start: number; end: number } | { min: number; max: number; target?: number }; // % of FTP or specific watts
    cadence?: number;
    text?: string;
}

export interface WorkoutDefinition {
    id: string;
    name: string;
    description: string;
    steps: WorkoutStep[];
}

// Helper to generate ramp steps
function generateRampSteps(): WorkoutStep[] {
    const steps: WorkoutStep[] = [];

    // Warmup: 5 mins at 40% FTP (113/282 approx 0.4)
    steps.push({ type: 'WARMUP', duration: 300, power: 0.40, text: 'Warm up' });

    // Ramp Steps: Start at 50% (141W), +10% (28W) every minute
    // We'll generate steps up to a very high % to ensure failure (e.g. 250% FTP)
    // 50% to 250% is 20 steps of 10%

    let currentPercent = 0.50;
    const stepDuration = 60; // 1 minute

    for (let i = 0; i < 25; i++) {
        steps.push({
            type: 'ACTIVE',
            duration: stepDuration,
            power: parseFloat(currentPercent.toFixed(2)),
            text: `Step ${i + 1}: ${(currentPercent * 100).toFixed(0)}% FTP`
        });
        currentPercent += 0.10;
    }

    // Cooldown: 5 mins at 40% FTP
    steps.push({ type: 'COOLDOWN', duration: 300, power: 0.40, text: 'Cool down' });

    return steps;
}

export const TEST_PROTOCOLS: Record<WorkoutType, WorkoutDefinition> = {
    CP3: {
        id: 'test-cp3',
        name: 'Critical Power 3 Minute Test',
        description: 'A 3-minute all-out effort to determine your short-duration power capacity.',
        steps: [
            { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up nicely' },
            { type: 'ACTIVE', duration: 30, power: 1.10, text: 'Priming effort' },
            { type: 'REST', duration: 180, power: 0.50, text: 'Recover' },
            { type: 'ACTIVE', duration: 180, power: 1.50, text: 'ALL OUT 3 MINUTES!' }, // 1.50 is a placeholder, user should go max
            { type: 'COOLDOWN', duration: 600, power: 0.50, text: 'Cool down' },
        ]
    },
    CP5: {
        id: 'test-cp5',
        name: 'Critical Power 5 Minute Test',
        description: 'A 5-minute all-out effort, classic VO2max test duration.',
        steps: [
            { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up' },
            { type: 'ACTIVE', duration: 60, power: 1.05, text: 'Opener' },
            { type: 'REST', duration: 300, power: 0.50, text: 'Recover well' },
            { type: 'ACTIVE', duration: 300, power: 1.20, text: 'MAX EFFORT 5 MIN' },
            { type: 'COOLDOWN', duration: 600, power: 0.50, text: 'Cool down' },
        ]
    },
    CP12: {
        id: 'test-cp12',
        name: 'Critical Power 12 Minute Test',
        description: 'A 12-minute effort to help estimate FTP and Critical Power.',
        steps: [
            { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up' },
            { type: 'ACTIVE', duration: 120, power: 0.90, text: 'Tempo activation' },
            { type: 'REST', duration: 300, power: 0.50, text: 'Recover' },
            { type: 'ACTIVE', duration: 720, power: 1.05, text: 'BEST AVERAGE POWER 12 MIN' },
            { type: 'COOLDOWN', duration: 600, power: 0.50, text: 'Cool down' },
        ]
    },
    RAMP: {
        id: 'test-ramp',
        name: 'Ramp Test (TrainerDay Style)',
        description: 'Step test to failure. Start at 50% FTP, increase 10% every minute.',
        steps: generateRampSteps()
    },
    SPRINT: {
        id: 'test-sprint',
        name: 'Sprint Profile',
        description: 'Multiple sprints to determine Pmax and fatigue resistance.',
        steps: [
            { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up' },
            { type: 'ACTIVE', duration: 6, power: 2.50, text: 'SPRINT 1' },
            { type: 'REST', duration: 240, power: 0.40, text: 'Recover' },
            { type: 'ACTIVE', duration: 10, power: 2.50, text: 'SPRINT 2' },
            { type: 'REST', duration: 240, power: 0.40, text: 'Recover' },
            { type: 'ACTIVE', duration: 15, power: 2.50, text: 'SPRINT 3' },
            { type: 'COOLDOWN', duration: 600, power: 0.50, text: 'Cool down' },
        ]
    }
};
