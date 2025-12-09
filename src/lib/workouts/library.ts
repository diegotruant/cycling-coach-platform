import { TEST_PROTOCOLS, WorkoutDefinition, WorkoutStep } from './protocols';

export const WORKOUT_CATEGORIES = {
    RECOVERY: 'Recovery',
    ENDURANCE: 'Endurance',
    TEMPO: 'Tempo / Sweet Spot',
    THRESHOLD: 'Threshold',
    VO2MAX: 'VO2max',
    ANAEROBIC: 'Anaerobic / Sprint',
    TEST: 'Testing'
};

function createRonnestadBlock(repetitions: number): WorkoutStep[] {
    const steps: WorkoutStep[] = [];
    for (let i = 0; i < repetitions; i++) {
        steps.push({ type: 'ACTIVE', duration: 30, power: 1.20, text: 'HARD 30s' });
        steps.push({ type: 'REST', duration: 15, power: 0.50, text: 'Easy 15s' });
    }
    return steps;
}

export const WORKOUT_LIBRARY: Record<string, WorkoutDefinition[]> = {
    [WORKOUT_CATEGORIES.TEST]: Object.values(TEST_PROTOCOLS),

    [WORKOUT_CATEGORIES.RECOVERY]: [
        {
            id: 'rec-1',
            name: 'Active Recovery 45',
            description: '45 minutes of easy spinning to flush out legs. Keep HR low.',
            steps: [
                { type: 'WARMUP', duration: 600, power: 0.45, text: 'Easy spin' },
                { type: 'ACTIVE', duration: 1500, power: 0.50, text: 'Zone 1 Steady' },
                { type: 'COOLDOWN', duration: 600, power: 0.45, text: 'Cool down' }
            ]
        },
        {
            id: 'rec-2',
            name: 'Coffee Ride 60',
            description: '60 minutes easy. Social pace.',
            steps: [
                { type: 'WARMUP', duration: 600, power: 0.50, text: 'Warm up' },
                { type: 'ACTIVE', duration: 2400, power: 0.55, text: 'Zone 1/2 Border' },
                { type: 'COOLDOWN', duration: 600, power: 0.50, text: 'Cool down' }
            ]
        }
    ],

    [WORKOUT_CATEGORIES.ENDURANCE]: [
        {
            id: 'end-1',
            name: 'Endurance 90',
            description: '90 minutes steady state in Zone 2. Building aerobic base.',
            steps: [
                { type: 'WARMUP', duration: 600, power: 0.55, text: 'Warm up' },
                { type: 'ACTIVE', duration: 4200, power: 0.65, text: 'Zone 2 Steady' },
                { type: 'COOLDOWN', duration: 600, power: 0.50, text: 'Cool down' }
            ]
        },
        {
            id: 'end-2',
            name: 'Long Ride 3h',
            description: '3 hours endurance. Essential for metabolic efficiency.',
            steps: [
                { type: 'WARMUP', duration: 1200, power: 0.55, text: 'Long Warm up' },
                { type: 'ACTIVE', duration: 9000, power: 0.65, text: 'Zone 2 Cruising' },
                { type: 'COOLDOWN', duration: 600, power: 0.50, text: 'Cool down' }
            ]
        }
    ],

    [WORKOUT_CATEGORIES.TEMPO]: [
        {
            id: 'sst-2x20',
            name: 'Sweet Spot 2x20',
            description: '2x20 mins at 88-92% FTP. "Bang for buck" workout.',
            steps: [
                { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up' },
                { type: 'ACTIVE', duration: 300, power: 0.80, text: 'Tempo' },
                { type: 'REST', duration: 180, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 1200, power: 0.90, text: 'Sweet Spot 1' },
                { type: 'REST', duration: 300, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 1200, power: 0.90, text: 'Sweet Spot 2' },
                { type: 'COOLDOWN', duration: 900, power: 0.50, text: 'Cool down' }
            ]
        },
        {
            id: 'tempo-3x15',
            name: 'Tempo 3x15',
            description: '3x15 mins at 80-85% FTP. Muscular endurance.',
            steps: [
                { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up' },
                { type: 'ACTIVE', duration: 900, power: 0.83, text: 'Tempo 1' },
                { type: 'REST', duration: 300, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 900, power: 0.83, text: 'Tempo 2' },
                { type: 'REST', duration: 300, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 900, power: 0.83, text: 'Tempo 3' },
                { type: 'COOLDOWN', duration: 900, power: 0.50, text: 'Cool down' }
            ]
        }
    ],

    [WORKOUT_CATEGORIES.THRESHOLD]: [
        {
            id: 'thr-2x20',
            name: '2x20 FTP Intervals',
            description: 'Classic threshold builder. 2 blocks of 20 minutes at 95-100% FTP.',
            steps: [
                { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up' },
                { type: 'ACTIVE', duration: 300, power: 0.80, text: 'Priming' },
                { type: 'REST', duration: 300, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 1200, power: 0.98, text: 'Threshold 1' },
                { type: 'REST', duration: 600, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 1200, power: 0.98, text: 'Threshold 2' },
                { type: 'COOLDOWN', duration: 900, power: 0.50, text: 'Cool down' }
            ]
        },
        {
            id: 'thr-over-under',
            name: 'Over-Unders 3x12',
            description: 'Lactate clearance. 2min @ 95%, 1min @ 105% repeated.',
            steps: [
                { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up' },
                { type: 'ACTIVE', duration: 120, power: 0.95, text: 'Under' },
                { type: 'ACTIVE', duration: 60, power: 1.05, text: 'Over' },
                { type: 'ACTIVE', duration: 120, power: 0.95, text: 'Under' },
                { type: 'ACTIVE', duration: 60, power: 1.05, text: 'Over' },
                { type: 'ACTIVE', duration: 120, power: 0.95, text: 'Under' },
                { type: 'ACTIVE', duration: 60, power: 1.05, text: 'Over' },
                { type: 'ACTIVE', duration: 120, power: 0.95, text: 'Under' },
                { type: 'ACTIVE', duration: 60, power: 1.05, text: 'Over' },
                { type: 'REST', duration: 300, power: 0.50, text: 'Recover' },
                // Repeat block 2
                { type: 'ACTIVE', duration: 120, power: 0.95, text: 'Under' },
                { type: 'ACTIVE', duration: 60, power: 1.05, text: 'Over' },
                { type: 'ACTIVE', duration: 120, power: 0.95, text: 'Under' },
                { type: 'ACTIVE', duration: 60, power: 1.05, text: 'Over' },
                { type: 'ACTIVE', duration: 120, power: 0.95, text: 'Under' },
                { type: 'ACTIVE', duration: 60, power: 1.05, text: 'Over' },
                { type: 'ACTIVE', duration: 120, power: 0.95, text: 'Under' },
                { type: 'ACTIVE', duration: 60, power: 1.05, text: 'Over' },
                { type: 'REST', duration: 300, power: 0.50, text: 'Recover' },
                // Repeat block 3
                { type: 'ACTIVE', duration: 120, power: 0.95, text: 'Under' },
                { type: 'ACTIVE', duration: 60, power: 1.05, text: 'Over' },
                { type: 'ACTIVE', duration: 120, power: 0.95, text: 'Under' },
                { type: 'ACTIVE', duration: 60, power: 1.05, text: 'Over' },
                { type: 'ACTIVE', duration: 120, power: 0.95, text: 'Under' },
                { type: 'ACTIVE', duration: 60, power: 1.05, text: 'Over' },
                { type: 'ACTIVE', duration: 120, power: 0.95, text: 'Under' },
                { type: 'ACTIVE', duration: 60, power: 1.05, text: 'Over' },
                { type: 'COOLDOWN', duration: 900, power: 0.50, text: 'Cool down' }
            ]
        }
    ],

    [WORKOUT_CATEGORIES.VO2MAX]: [
        {
            id: 'vo2-long-4x4',
            name: 'Long Intervals: 4x4min',
            description: '4x4 mins at 105-110% FTP. Classic VO2max builder.',
            steps: [
                { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up' },
                { type: 'ACTIVE', duration: 240, power: 1.08, text: 'Interval 1' },
                { type: 'REST', duration: 180, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 240, power: 1.08, text: 'Interval 2' },
                { type: 'REST', duration: 180, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 240, power: 1.08, text: 'Interval 3' },
                { type: 'REST', duration: 180, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 240, power: 1.08, text: 'Interval 4' },
                { type: 'COOLDOWN', duration: 900, power: 0.50, text: 'Cool down' }
            ]
        },
        {
            id: 'vo2-short-30-15-2sets',
            name: 'Short Intervals: 2x(10x30/15s)',
            description: '2 sets of 10 reps (30s @ 120%, 15s @ 50%). High time @ VO2max with less RPE than long intervals.',
            steps: [
                { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up' },
                // Set 1
                ...createRonnestadBlock(10),
                { type: 'REST', duration: 300, power: 0.40, text: 'Set Recovery' },
                // Set 2
                ...createRonnestadBlock(10),
                { type: 'COOLDOWN', duration: 900, power: 0.50, text: 'Cool down' }
            ]
        },
        {
            id: 'vo2-ronnestad',
            name: 'Ronnestad 30/15s (3 Sets)',
            description: '3 sets of 13x(30s ON, 15s OFF). High density VO2max work.',
            steps: [
                { type: 'WARMUP', duration: 1200, power: 0.55, text: 'Warm up' },
                ...createRonnestadBlock(13),
                { type: 'REST', duration: 300, power: 0.40, text: 'Recover' },
                ...createRonnestadBlock(13),
                { type: 'REST', duration: 300, power: 0.40, text: 'Recover' },
                ...createRonnestadBlock(13),
                { type: 'COOLDOWN', duration: 900, power: 0.45, text: 'Cool down' }
            ]
        },
        {
            id: 'vo2-4x8',
            name: 'Seiler 4x8min',
            description: '4x8 mins at 105-110% FTP. The "Gold Standard" for VO2max adaptations.',
            steps: [
                { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up' },
                { type: 'ACTIVE', duration: 480, power: 1.08, text: 'Interval 1' },
                { type: 'REST', duration: 120, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 480, power: 1.08, text: 'Interval 2' },
                { type: 'REST', duration: 120, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 480, power: 1.08, text: 'Interval 3' },
                { type: 'REST', duration: 120, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 480, power: 1.08, text: 'Interval 4' },
                { type: 'COOLDOWN', duration: 900, power: 0.50, text: 'Cool down' }
            ]
        },
        {
            id: 'vo2-5x5',
            name: 'Classic 5x5min',
            description: '5x5 mins at 110-115% FTP. Hard VO2max.',
            steps: [
                { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up' },
                { type: 'ACTIVE', duration: 300, power: 1.12, text: 'Interval 1' },
                { type: 'REST', duration: 300, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 300, power: 1.12, text: 'Interval 2' },
                { type: 'REST', duration: 300, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 300, power: 1.12, text: 'Interval 3' },
                { type: 'REST', duration: 300, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 300, power: 1.12, text: 'Interval 4' },
                { type: 'REST', duration: 300, power: 0.50, text: 'Recover' },
                { type: 'ACTIVE', duration: 300, power: 1.12, text: 'Interval 5' },
                { type: 'COOLDOWN', duration: 900, power: 0.50, text: 'Cool down' }
            ]
        }
    ],

    [WORKOUT_CATEGORIES.ANAEROBIC]: [
        {
            id: 'ana-sit-4x30s',
            name: 'SIT: 4x30s All-Out',
            description: 'Sprint Interval Training. 4 efforts of 30s MAX effort with long recovery (4m). Increases Pmax and Anaerobic Capacity.',
            steps: [
                { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up' },
                { type: 'ACTIVE', duration: 30, power: 2.0, text: 'MAX EFFORT' },
                { type: 'REST', duration: 240, power: 0.40, text: 'Deep Recovery' },
                { type: 'ACTIVE', duration: 30, power: 2.0, text: 'MAX EFFORT' },
                { type: 'REST', duration: 240, power: 0.40, text: 'Deep Recovery' },
                { type: 'ACTIVE', duration: 30, power: 2.0, text: 'MAX EFFORT' },
                { type: 'REST', duration: 240, power: 0.40, text: 'Deep Recovery' },
                { type: 'ACTIVE', duration: 30, power: 2.0, text: 'MAX EFFORT' },
                { type: 'COOLDOWN', duration: 900, power: 0.50, text: 'Cool down' }
            ]
        },
        {
            id: 'ana-rst-3x6x10s',
            name: 'RST: 3 sets of 6x10s',
            description: 'Repeated Sprint Training. Improves ability to recover from repeated surges.',
            steps: [
                { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up' },
                // Set 1
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'REST', duration: 300, power: 0.4, text: 'Set Recovery' },
                // Set 2
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'REST', duration: 300, power: 0.4, text: 'Set Recovery' },
                // Set 3
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'ACTIVE', duration: 10, power: 1.8, text: 'Sprint' }, { type: 'REST', duration: 50, power: 0.5, text: 'Float' },
                { type: 'COOLDOWN', duration: 900, power: 0.50, text: 'Cool down' }
            ]
        },
        {
            id: 'ana-tabata',
            name: 'Tabata Intervals',
            description: '20s ON @ 170%, 10s OFF. 3 Sets of 8 reps. Brutal.',
            steps: [
                { type: 'WARMUP', duration: 900, power: 0.55, text: 'Warm up' },
                // Set 1
                { type: 'ACTIVE', duration: 20, power: 1.70, text: 'Sprint!' }, { type: 'REST', duration: 10, power: 0.0, text: 'Rest' },
                { type: 'ACTIVE', duration: 20, power: 1.70, text: 'Sprint!' }, { type: 'REST', duration: 10, power: 0.0, text: 'Rest' },
                { type: 'ACTIVE', duration: 20, power: 1.70, text: 'Sprint!' }, { type: 'REST', duration: 10, power: 0.0, text: 'Rest' },
                { type: 'ACTIVE', duration: 20, power: 1.70, text: 'Sprint!' }, { type: 'REST', duration: 10, power: 0.0, text: 'Rest' },
                { type: 'ACTIVE', duration: 20, power: 1.70, text: 'Sprint!' }, { type: 'REST', duration: 10, power: 0.0, text: 'Rest' },
                { type: 'ACTIVE', duration: 20, power: 1.70, text: 'Sprint!' }, { type: 'REST', duration: 10, power: 0.0, text: 'Rest' },
                { type: 'ACTIVE', duration: 20, power: 1.70, text: 'Sprint!' }, { type: 'REST', duration: 10, power: 0.0, text: 'Rest' },
                { type: 'ACTIVE', duration: 20, power: 1.70, text: 'Sprint!' }, { type: 'REST', duration: 10, power: 0.0, text: 'Rest' },

                { type: 'REST', duration: 600, power: 0.40, text: 'Recover' },
                // ... (simplified for brevity, usually 3 sets)
                { type: 'COOLDOWN', duration: 900, power: 0.50, text: 'Cool down' }
            ]
        }
    ]
};
