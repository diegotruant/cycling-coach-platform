
export interface WorkoutStep {
    type: 'warmup' | 'active' | 'rest' | 'cooldown';
    duration: number; // seconds
    targetType: 'percent_ftp' | 'percent_hr' | 'rpe' | 'zone';
    targetValue: number | [number, number]; // e.g., 90 or [85, 95]
    description?: string;
    cadence?: number;
}

export interface WorkoutTemplate {
    id: string;
    name: string;
    description: string;
    category: 'RECOVERY' | 'ENDURANCE' | 'TEMPO' | 'SWEET_SPOT' | 'THRESHOLD' | 'VO2MAX' | 'ANAEROBIC' | 'SPRINT' | 'STRENGTH';
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
    duration: number; // Total duration in minutes
    tss: number; // Estimated TSS
    steps: WorkoutStep[];
    tags: string[]; // e.g., "HIIT", "Tabata", "Under 40", "Master", "Female", "Zwift", "Coggan"
    evidenceBasedRef?: string; // Citation or reference
}

export const WORKOUT_LIBRARY: WorkoutTemplate[] = [
    // --- RECOVERY ---
    {
        id: 'coggan-active-recovery',
        name: 'Coggan Active Recovery (Zone 1)',
        description: 'Classic active recovery ride. Keeps blood flowing to aid recovery without inducing fatigue. Stay strictly below 55% FTP.',
        category: 'RECOVERY',
        difficulty: 'BEGINNER',
        duration: 60,
        tss: 30,
        tags: ['Recovery', 'Coggan', 'Base'],
        evidenceBasedRef: 'Coggan & Allen - Training and Racing with a Power Meter',
        steps: [
            { type: 'active', duration: 3600, targetType: 'percent_ftp', targetValue: [45, 55], description: 'Easy spin, high cadence' }
        ]
    },

    // --- ENDURANCE (ZONE 2) ---
    {
        id: 'endurance-lsd',
        name: 'Long Slow Distance (Zone 2)',
        description: 'Classic Zone 2 endurance ride. Builds mitochondrial density, fat oxidation, and capillary density. The foundation of polarized training.',
        category: 'ENDURANCE',
        difficulty: 'BEGINNER',
        duration: 180,
        tss: 120,
        tags: ['Endurance', 'Base', 'Polarized', 'General'],
        evidenceBasedRef: 'Seiler - Polarized Training Model',
        steps: [
            { type: 'active', duration: 10800, targetType: 'percent_ftp', targetValue: [60, 70], description: 'Steady Zone 2 effort' }
        ]
    },
    {
        id: 'friel-aerobic-endurance',
        name: 'Friel Aerobic Endurance',
        description: 'Steady state ride in Zone 2 to build aerobic engine. Friel recommends this for 40% of weekly training in Base period.',
        category: 'ENDURANCE',
        difficulty: 'INTERMEDIATE',
        duration: 120,
        tss: 80,
        tags: ['Endurance', 'Friel', 'Base'],
        evidenceBasedRef: 'Joe Friel - The Cyclist\'s Training Bible',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 50, description: 'Warmup' },
            { type: 'active', duration: 5400, targetType: 'percent_ftp', targetValue: [65, 75], description: 'Zone 2 Steady' },
            { type: 'cooldown', duration: 900, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },

    // --- TEMPO / SWEET SPOT ---
    {
        id: 'sweet-spot-classic',
        name: 'Classic Sweet Spot 2x20',
        description: 'Two 20-minute intervals at 88-94% FTP. The "Sweet Spot" provides a high training stimulus with manageable fatigue, ideal for raising FTP.',
        category: 'SWEET_SPOT',
        difficulty: 'INTERMEDIATE',
        duration: 90,
        tss: 80,
        tags: ['Sweet Spot', 'FTP', 'Master', 'Base'],
        evidenceBasedRef: 'Frank Overton - Sweet Spot Training',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 60, description: 'Warmup' },
            { type: 'active', duration: 1200, targetType: 'percent_ftp', targetValue: 90, description: 'Sweet Spot 1' },
            { type: 'rest', duration: 300, targetType: 'percent_ftp', targetValue: 55, description: 'Recovery' },
            { type: 'active', duration: 1200, targetType: 'percent_ftp', targetValue: 90, description: 'Sweet Spot 2' },
            { type: 'cooldown', duration: 900, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },
    {
        id: 'master-tempo-intervals',
        name: 'Master Tempo Intervals',
        description: 'Longer intervals at Tempo/Sweetspot (85-90% FTP). Less taxing on the CNS than HIIT, suitable for masters athletes to build base and threshold without excessive fatigue.',
        category: 'TEMPO',
        difficulty: 'INTERMEDIATE',
        duration: 90,
        tss: 80,
        tags: ['Master', 'Over 40', 'Endurance', 'Base'],
        evidenceBasedRef: 'Friel - Fast After 50',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 60, description: 'Warmup' },
            { type: 'active', duration: 1200, targetType: 'percent_ftp', targetValue: 88, description: 'Tempo/Sweetspot' },
            { type: 'rest', duration: 300, targetType: 'percent_ftp', targetValue: 55, description: 'Recovery' },
            { type: 'active', duration: 1200, targetType: 'percent_ftp', targetValue: 88, description: 'Tempo/Sweetspot' },
            { type: 'rest', duration: 300, targetType: 'percent_ftp', targetValue: 55, description: 'Recovery' },
            { type: 'active', duration: 1200, targetType: 'percent_ftp', targetValue: 88, description: 'Tempo/Sweetspot' },
            { type: 'cooldown', duration: 900, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },
    {
        id: 'tempo-bursts',
        name: 'Tempo with Bursts',
        description: 'Steady Tempo effort (Zone 3) punctuated by short 10-second bursts every few minutes. Simulates group ride surges.',
        category: 'TEMPO',
        difficulty: 'ADVANCED',
        duration: 90,
        tss: 95,
        tags: ['Tempo', 'Race Specific', 'Group Ride'],
        evidenceBasedRef: 'Carmichael Training Systems (CTS)',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 60, description: 'Warmup' },
            // Block 1: 20 mins
            { type: 'active', duration: 1200, targetType: 'percent_ftp', targetValue: 80, description: 'Tempo (insert 10s burst @ 120% every 4 mins)' },
            { type: 'rest', duration: 300, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            // Block 2: 20 mins
            { type: 'active', duration: 1200, targetType: 'percent_ftp', targetValue: 80, description: 'Tempo (insert 10s burst @ 120% every 4 mins)' },
            { type: 'cooldown', duration: 900, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },

    // --- THRESHOLD ---
    {
        id: 'seiler-4x8',
        name: 'Seiler 4x8min Threshold',
        description: 'The "Goldilocks" of interval training. 4 bouts of 8 minutes at roughly 90% HRmax (approx 105-108% FTP). Balances intensity and accumulation of time at high intensity.',
        category: 'THRESHOLD',
        difficulty: 'INTERMEDIATE',
        duration: 75,
        tss: 90,
        tags: ['Threshold', 'VO2max', 'Master', 'General', 'Female'],
        evidenceBasedRef: 'Seiler et al. (2013) - Adaptations to aerobic interval training',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: [55, 75], description: 'Warmup' },
            { type: 'active', duration: 480, targetType: 'percent_ftp', targetValue: 105, description: 'Interval 1' },
            { type: 'rest', duration: 120, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            { type: 'active', duration: 480, targetType: 'percent_ftp', targetValue: 105, description: 'Interval 2' },
            { type: 'rest', duration: 120, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            { type: 'active', duration: 480, targetType: 'percent_ftp', targetValue: 105, description: 'Interval 3' },
            { type: 'rest', duration: 120, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            { type: 'active', duration: 480, targetType: 'percent_ftp', targetValue: 105, description: 'Interval 4' },
            { type: 'cooldown', duration: 900, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },
    {
        id: 'over-under-2x12',
        name: 'Over-Unders 2x12 (Lactate Clearance)',
        description: 'Alternating between just above (105%) and just below (90%) FTP. Teaches the body to clear lactate while working hard. 2 minutes Over, 2 minutes Under.',
        category: 'THRESHOLD',
        difficulty: 'ADVANCED',
        duration: 60,
        tss: 85,
        tags: ['Threshold', 'Lactate Clearance', 'Race Specific'],
        evidenceBasedRef: 'Various - Lactate Shuttle Theory (Brooks)',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 60, description: 'Warmup' },
            // Set 1 (12 mins)
            { type: 'active', duration: 120, targetType: 'percent_ftp', targetValue: 90, description: 'Under' },
            { type: 'active', duration: 120, targetType: 'percent_ftp', targetValue: 105, description: 'Over' },
            { type: 'active', duration: 120, targetType: 'percent_ftp', targetValue: 90, description: 'Under' },
            { type: 'active', duration: 120, targetType: 'percent_ftp', targetValue: 105, description: 'Over' },
            { type: 'active', duration: 120, targetType: 'percent_ftp', targetValue: 90, description: 'Under' },
            { type: 'active', duration: 120, targetType: 'percent_ftp', targetValue: 105, description: 'Over' },
            { type: 'rest', duration: 300, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            // Set 2
            { type: 'active', duration: 120, targetType: 'percent_ftp', targetValue: 90, description: 'Under' },
            { type: 'active', duration: 120, targetType: 'percent_ftp', targetValue: 105, description: 'Over' },
            { type: 'active', duration: 120, targetType: 'percent_ftp', targetValue: 90, description: 'Under' },
            { type: 'active', duration: 120, targetType: 'percent_ftp', targetValue: 105, description: 'Over' },
            { type: 'active', duration: 120, targetType: 'percent_ftp', targetValue: 90, description: 'Under' },
            { type: 'active', duration: 120, targetType: 'percent_ftp', targetValue: 105, description: 'Over' },
            { type: 'cooldown', duration: 600, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },
    {
        id: 'threshold-ladders',
        name: 'Threshold Ladders',
        description: 'Climbing ladder intervals spending time at 95%, 100%, and 105% FTP. Improves ability to handle pace changes near threshold.',
        category: 'THRESHOLD',
        difficulty: 'ADVANCED',
        duration: 75,
        tss: 90,
        tags: ['Threshold', 'Race Specific'],
        evidenceBasedRef: 'Hunter Allen - Power Training',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 60, description: 'Warmup' },
            { type: 'active', duration: 300, targetType: 'percent_ftp', targetValue: 95, description: '95% FTP' },
            { type: 'active', duration: 240, targetType: 'percent_ftp', targetValue: 100, description: '100% FTP' },
            { type: 'active', duration: 180, targetType: 'percent_ftp', targetValue: 105, description: '105% FTP' },
            { type: 'rest', duration: 300, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            { type: 'active', duration: 300, targetType: 'percent_ftp', targetValue: 95, description: '95% FTP' },
            { type: 'active', duration: 240, targetType: 'percent_ftp', targetValue: 100, description: '100% FTP' },
            { type: 'active', duration: 180, targetType: 'percent_ftp', targetValue: 105, description: '105% FTP' },
            { type: 'cooldown', duration: 600, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },

    // --- VO2 MAX ---
    {
        id: 'ronnestad-30-15',
        name: 'Rønnestad 30/15 Short Intervals',
        description: 'High-intensity intervals consisting of 30 seconds of work followed by 15 seconds of recovery. Proven to improve VO2max and power output more effectively than long intervals.',
        category: 'VO2MAX',
        difficulty: 'ADVANCED',
        duration: 60,
        tss: 85,
        tags: ['HIIT', 'VO2max', 'Elite', 'Master', 'Female'],
        evidenceBasedRef: 'Rønnestad et al. (2015) - Short intervals induce superior training adaptations',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: [55, 75], description: 'Progressive warmup' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 120, description: 'Hard effort (13x)' },
            { type: 'rest', duration: 15, targetType: 'percent_ftp', targetValue: 50, description: 'Easy spin (13x)' },
            { type: 'rest', duration: 180, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery between sets' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 120, description: 'Hard effort (13x)' },
            { type: 'rest', duration: 15, targetType: 'percent_ftp', targetValue: 50, description: 'Easy spin (13x)' },
            { type: 'rest', duration: 180, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery between sets' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 120, description: 'Hard effort (13x)' },
            { type: 'rest', duration: 15, targetType: 'percent_ftp', targetValue: 50, description: 'Easy spin (13x)' },
            { type: 'cooldown', duration: 900, targetType: 'percent_ftp', targetValue: [50, 60], description: 'Cooldown' }
        ]
    },
    {
        id: 'hickson-intervals',
        name: 'Hickson Intervals (5x5min)',
        description: 'Classic VO2max intervals. 5 minutes at VO2max intensity (approx 106-120% FTP) with equal recovery. Highly effective for boosting aerobic capacity.',
        category: 'VO2MAX',
        difficulty: 'ELITE',
        duration: 75,
        tss: 110,
        tags: ['VO2max', 'Elite', 'Under 40'],
        evidenceBasedRef: 'Hickson et al. (1977) - Linear increase in aerobic power',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 60, description: 'Warmup' },
            { type: 'active', duration: 300, targetType: 'percent_ftp', targetValue: 115, description: 'VO2max Interval 1' },
            { type: 'rest', duration: 300, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            { type: 'active', duration: 300, targetType: 'percent_ftp', targetValue: 115, description: 'VO2max Interval 2' },
            { type: 'rest', duration: 300, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            { type: 'active', duration: 300, targetType: 'percent_ftp', targetValue: 115, description: 'VO2max Interval 3' },
            { type: 'rest', duration: 300, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            { type: 'active', duration: 300, targetType: 'percent_ftp', targetValue: 115, description: 'VO2max Interval 4' },
            { type: 'rest', duration: 300, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            { type: 'active', duration: 300, targetType: 'percent_ftp', targetValue: 115, description: 'VO2max Interval 5' },
            { type: 'cooldown', duration: 900, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },
    {
        id: 'billat-30-30',
        name: 'Billat 30-30 vVO2max',
        description: '30 seconds at vVO2max (velocity at VO2max) followed by 30 seconds at 50% vVO2max. Maximizes time spent at VO2max without excessive lactate accumulation.',
        category: 'VO2MAX',
        difficulty: 'ADVANCED',
        duration: 60,
        tss: 80,
        tags: ['VO2max', 'Elite', 'Master'],
        evidenceBasedRef: 'Billat et al. (2000) - Interval training at VO2max',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 60, description: 'Warmup' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 130, description: 'vVO2max (Repeat 15-20x)' },
            { type: 'rest', duration: 30, targetType: 'percent_ftp', targetValue: 65, description: 'Float (Repeat 15-20x)' },
            { type: 'cooldown', duration: 600, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },
    {
        id: 'hard-start-intervals',
        name: 'Hard Start VO2max',
        description: 'Intervals starting with a 30s surge at 140% FTP to rapidly deplete W\' and elevate HR, followed by settling into VO2max intensity (110%).',
        category: 'VO2MAX',
        difficulty: 'ELITE',
        duration: 60,
        tss: 90,
        tags: ['VO2max', 'Race Specific', 'Elite'],
        evidenceBasedRef: 'Various - Oxygen Kinetics Optimization',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 60, description: 'Warmup' },
            // 4 reps
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 140, description: 'Hard Start' },
            { type: 'active', duration: 210, targetType: 'percent_ftp', targetValue: 110, description: 'Settle in' },
            { type: 'rest', duration: 240, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            // ... repeat
            { type: 'cooldown', duration: 600, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },

    // --- ANAEROBIC / SPRINT ---
    {
        id: 'sit-sprint-intervals',
        name: 'SIT: 30s All-Out (Gibala)',
        description: 'Sprint Interval Training. 4-6 reps of 30 seconds ALL OUT effort with long recovery (4 mins). Improves VO2max and anaerobic capacity with very low total training volume.',
        category: 'SPRINT',
        difficulty: 'ADVANCED',
        duration: 45,
        tss: 60,
        tags: ['SIT', 'Anaerobic', 'Time-Crunched', 'Under 40'],
        evidenceBasedRef: 'Gibala et al. (2006) - Short-term sprint interval versus traditional endurance training',
        steps: [
            { type: 'warmup', duration: 600, targetType: 'percent_ftp', targetValue: 60, description: 'Warmup' },
            { type: 'active', duration: 30, targetType: 'rpe', targetValue: 10, description: 'MAX EFFORT SPRINT' },
            { type: 'rest', duration: 240, targetType: 'percent_ftp', targetValue: 40, description: 'Very easy spin' },
            { type: 'active', duration: 30, targetType: 'rpe', targetValue: 10, description: 'MAX EFFORT SPRINT' },
            { type: 'rest', duration: 240, targetType: 'percent_ftp', targetValue: 40, description: 'Very easy spin' },
            { type: 'active', duration: 30, targetType: 'rpe', targetValue: 10, description: 'MAX EFFORT SPRINT' },
            { type: 'rest', duration: 240, targetType: 'percent_ftp', targetValue: 40, description: 'Very easy spin' },
            { type: 'active', duration: 30, targetType: 'rpe', targetValue: 10, description: 'MAX EFFORT SPRINT' },
            { type: 'cooldown', duration: 600, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },
    {
        id: 'rehit-2x20',
        name: 'REHIT: 2x20s Sprints',
        description: 'Reduced Exertion High-Intensity Interval Training. Just two 20-second max sprints in a 10-minute ride. Proven to improve VO2max and insulin sensitivity.',
        category: 'SPRINT',
        difficulty: 'BEGINNER',
        duration: 15,
        tss: 20,
        tags: ['REHIT', 'Health', 'Time-Crunched', 'Female', 'Master'],
        evidenceBasedRef: 'Metcalfe et al. (2012) - Towards the minimal amount of exercise for improving metabolic health',
        steps: [
            { type: 'warmup', duration: 180, targetType: 'percent_ftp', targetValue: 50, description: 'Warmup' },
            { type: 'active', duration: 20, targetType: 'rpe', targetValue: 10, description: 'MAX SPRINT' },
            { type: 'rest', duration: 180, targetType: 'percent_ftp', targetValue: 40, description: 'Easy recovery' },
            { type: 'active', duration: 20, targetType: 'rpe', targetValue: 10, description: 'MAX SPRINT' },
            { type: 'cooldown', duration: 180, targetType: 'percent_ftp', targetValue: 40, description: 'Cooldown' }
        ]
    },
    {
        id: '3b-30s-3min',
        name: '3B Training: 30"-3\' Protocol',
        description: 'Specific protocol from 3B Training/Formula HIIT. 30 seconds maximal sprint followed by 3 minutes active recovery. 10-12 reps. Targets glycolytic system and prevents detraining.',
        category: 'ANAEROBIC',
        difficulty: 'ELITE',
        duration: 60,
        tss: 75,
        tags: ['3B Training', 'Formula HIIT', 'Elite', 'Glycolytic'],
        evidenceBasedRef: 'Formula HIIT (Migliaccio) - 30"-3\' Protocol',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 60, description: 'Warmup' },
            { type: 'active', duration: 30, targetType: 'rpe', targetValue: 10, description: 'MAX SPRINT (10x)' },
            { type: 'rest', duration: 180, targetType: 'percent_ftp', targetValue: 50, description: 'Active Recovery (10x)' },
            { type: 'cooldown', duration: 600, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },
    {
        id: 'tabata-classic',
        name: 'Classic Tabata',
        description: 'The original Tabata protocol. 20 seconds ultra-intense (170% VO2max) / 10 seconds rest x 8 reps. Very short, extremely hard.',
        category: 'ANAEROBIC',
        difficulty: 'ADVANCED',
        duration: 30,
        tss: 40,
        tags: ['Tabata', 'HIIT', 'Under 40'],
        evidenceBasedRef: 'Tabata et al. (1996)',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 60, description: 'Warmup' },
            { type: 'active', duration: 20, targetType: 'percent_ftp', targetValue: 150, description: 'ALL OUT (x8)' },
            { type: 'rest', duration: 10, targetType: 'percent_ftp', targetValue: 0, description: 'Stop/Easy (x8)' },
            { type: 'cooldown', duration: 600, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },
    {
        id: '1min-anaerobic',
        name: '1-Minute Anaerobic Capacity',
        description: '5-8 reps of 1 minute all-out efforts with long recovery (3-5 mins). Targets anaerobic capacity and tolerance to high lactate levels.',
        category: 'ANAEROBIC',
        difficulty: 'ADVANCED',
        duration: 60,
        tss: 80,
        tags: ['Anaerobic', 'Race Specific', 'Coggan'],
        evidenceBasedRef: 'Coggan - Training and Racing with a Power Meter',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 60, description: 'Warmup' },
            { type: 'active', duration: 60, targetType: 'percent_ftp', targetValue: 150, description: '1 MIN MAX' },
            { type: 'rest', duration: 240, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            // x5
            { type: 'active', duration: 60, targetType: 'percent_ftp', targetValue: 150, description: '1 MIN MAX' },
            { type: 'rest', duration: 240, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            { type: 'cooldown', duration: 600, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },

    // --- STRENGTH / NEUROMUSCULAR ---
    {
        id: 'sfr-low-cadence',
        name: 'SFR (Salite Forza Resistenza)',
        description: 'Low cadence (40-50 RPM) intervals at Tempo/Threshold intensity. Improves muscular strength and pedal stroke efficiency on the bike.',
        category: 'STRENGTH',
        difficulty: 'INTERMEDIATE',
        duration: 60,
        tss: 60,
        tags: ['Strength', 'Climbing', 'Low Cadence'],
        evidenceBasedRef: 'Italian Cycling Federation (FCI) Methodology',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 60, description: 'Warmup' },
            { type: 'active', duration: 300, targetType: 'percent_ftp', targetValue: 85, cadence: 45, description: 'SFR 1 (40-50 RPM)' },
            { type: 'rest', duration: 180, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            { type: 'active', duration: 300, targetType: 'percent_ftp', targetValue: 85, cadence: 45, description: 'SFR 2 (40-50 RPM)' },
            { type: 'rest', duration: 180, targetType: 'percent_ftp', targetValue: 50, description: 'Recovery' },
            { type: 'active', duration: 300, targetType: 'percent_ftp', targetValue: 85, cadence: 45, description: 'SFR 3 (40-50 RPM)' },
            { type: 'cooldown', duration: 600, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },
    {
        id: 'standing-starts',
        name: 'Standing Starts (Force)',
        description: 'From a near stop, sprint max effort in a big gear for 10-15 seconds. Pure neuromuscular force production.',
        category: 'STRENGTH',
        difficulty: 'ADVANCED',
        duration: 45,
        tss: 50,
        tags: ['Neuromuscular', 'Sprint', 'Force'],
        evidenceBasedRef: 'Track Cycling Methodology',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 60, description: 'Warmup' },
            { type: 'active', duration: 15, targetType: 'rpe', targetValue: 10, description: 'MAX FORCE START' },
            { type: 'rest', duration: 300, targetType: 'percent_ftp', targetValue: 40, description: 'Full Recovery' },
            // x5
            { type: 'active', duration: 15, targetType: 'rpe', targetValue: 10, description: 'MAX FORCE START' },
            { type: 'rest', duration: 300, targetType: 'percent_ftp', targetValue: 40, description: 'Full Recovery' },
            { type: 'cooldown', duration: 600, targetType: 'percent_ftp', targetValue: 50, description: 'Cooldown' }
        ]
    },
    // --- NEW HIIT PROTOCOLS ---
    {
        id: 'hiit-11-rpe-hr',
        name: 'HIIT 11 – RPE & Heart‑Rate Focus',
        description: 'Adattamento individuale basato su percezione (RPE 7/10) o frequenza cardiaca (> 90 % FCmax). Stima 95‑100 % FTP.',
        category: 'ANAEROBIC',
        difficulty: 'INTERMEDIATE',
        duration: 30,
        tss: 30,
        tags: ['RPE', 'HR', 'Individualized'],
        evidenceBasedRef: 'Stima 95‑100 % FTP (RPE 7/10, > 90 % FCmax)',
        steps: [
            { type: 'warmup', duration: 900, targetType: 'percent_ftp', targetValue: 60, description: 'Riscaldamento' },
            // 8 ripetizioni: 9 s ON @ 95‑100 % FTP, 5 s OFF @ 55‑60 % FTP
            { type: 'active', duration: 9, targetType: 'percent_ftp', targetValue: [95, 100], description: 'Fase attiva 1' },
            { type: 'rest', duration: 5, targetType: 'percent_ftp', targetValue: [55, 60], description: 'Recupero 1' },
            { type: 'active', duration: 9, targetType: 'percent_ftp', targetValue: [95, 100], description: 'Fase attiva 2' },
            { type: 'rest', duration: 5, targetType: 'percent_ftp', targetValue: [55, 60], description: 'Recupero 2' },
            { type: 'active', duration: 9, targetType: 'percent_ftp', targetValue: [95, 100], description: 'Fase attiva 3' },
            { type: 'rest', duration: 5, targetType: 'percent_ftp', targetValue: [55, 60], description: 'Recupero 3' },
            { type: 'active', duration: 9, targetType: 'percent_ftp', targetValue: [95, 100], description: 'Fase attiva 4' },
            { type: 'rest', duration: 5, targetType: 'percent_ftp', targetValue: [55, 60], description: 'Recupero 4' },
            { type: 'active', duration: 9, targetType: 'percent_ftp', targetValue: [95, 100], description: 'Fase attiva 5' },
            { type: 'rest', duration: 5, targetType: 'percent_ftp', targetValue: [55, 60], description: 'Recupero 5' },
            { type: 'active', duration: 9, targetType: 'percent_ftp', targetValue: [95, 100], description: 'Fase attiva 6' },
            { type: 'rest', duration: 5, targetType: 'percent_ftp', targetValue: [55, 60], description: 'Recupero 6' },
            { type: 'active', duration: 9, targetType: 'percent_ftp', targetValue: [95, 100], description: 'Fase attiva 7' },
            { type: 'rest', duration: 5, targetType: 'percent_ftp', targetValue: [55, 60], description: 'Recupero 7' },
            { type: 'active', duration: 9, targetType: 'percent_ftp', targetValue: [95, 100], description: 'Fase attiva 8' },
            { type: 'rest', duration: 5, targetType: 'percent_ftp', targetValue: [55, 60], description: 'Recupero 8' },
            { type: 'cooldown', duration: 900, targetType: 'percent_ftp', targetValue: 50, description: 'Defaticamento' }
        ]
    },
    {
        id: 'hidit-decreasing-intervals',
        name: 'HIIT 12 – HIDIT (Decreasing Intervals)',
        description: 'Intervalli decrescenti basati su CP5 (≈ 115‑120 % FTP). Test CP5 consigliato prima dell’uso.',
        category: 'VO2MAX',
        difficulty: 'ADVANCED',
        duration: 35,
        tss: 55,
        tags: ['HIDIT', 'CP5', 'Decreasing'],
        evidenceBasedRef: 'CP5 ≈ 115‑120 % FTP (personalizzabile)',
        steps: [
            { type: 'warmup', duration: 1200, targetType: 'percent_ftp', targetValue: 60, description: 'Riscaldamento' },
            // Serie di intervalli ON/OFF decrescenti (esempio 4 cicli)
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 120, description: 'ON 1 (120 % FTP)' },
            { type: 'rest', duration: 20, targetType: 'percent_ftp', targetValue: 85, description: 'OFF 1 (85 % FTP)' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 120, description: 'ON 2' },
            { type: 'rest', duration: 20, targetType: 'percent_ftp', targetValue: 85, description: 'OFF 2' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 120, description: 'ON 3' },
            { type: 'rest', duration: 20, targetType: 'percent_ftp', targetValue: 85, description: 'OFF 3' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 120, description: 'ON 4' },
            { type: 'rest', duration: 20, targetType: 'percent_ftp', targetValue: 85, description: 'OFF 4' },
            // Ripetizione fino a esaurimento (esempio 6 cicli aggiuntivi)
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 120, description: 'ON 5' },
            { type: 'rest', duration: 20, targetType: 'percent_ftp', targetValue: 85, description: 'OFF 5' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 120, description: 'ON 6' },
            { type: 'rest', duration: 20, targetType: 'percent_ftp', targetValue: 85, description: 'OFF 6' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 120, description: 'ON 7' },
            { type: 'rest', duration: 20, targetType: 'percent_ftp', targetValue: 85, description: 'OFF 7' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 120, description: 'ON 8' },
            { type: 'rest', duration: 20, targetType: 'percent_ftp', targetValue: 85, description: 'OFF 8' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 120, description: 'ON 9' },
            { type: 'rest', duration: 20, targetType: 'percent_ftp', targetValue: 85, description: 'OFF 9' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 120, description: 'ON 10' },
            { type: 'rest', duration: 20, targetType: 'percent_ftp', targetValue: 85, description: 'OFF 10' },
            { type: 'cooldown', duration: 900, targetType: 'percent_ftp', targetValue: 50, description: 'Defaticamento' }
        ]
    },
    {
        id: 'hiit-13-varied',
        name: 'HIIT 13 – Varied Intermittent',
        description: 'VO₂max dinamico con blocchi da 5 min e variazioni interne (30" ON a 130 % FTP, 10" ON a 100 % FTP). Simula gara.',
        category: 'VO2MAX',
        difficulty: 'ADVANCED',
        duration: 40,
        tss: 60,
        tags: ['Varied', 'Race‑Simulation', 'Dynamic'],
        evidenceBasedRef: 'Blocco 5 min con variazioni A (130 % FTP) e B (100 % FTP)',
        steps: [
            { type: 'warmup', duration: 1200, targetType: 'percent_ftp', targetValue: 60, description: 'Riscaldamento' },
            // 4 blocchi di A/B (esempio)
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 130, description: 'Blocco A 1' },
            { type: 'active', duration: 10, targetType: 'percent_ftp', targetValue: 100, description: 'Blocco B 1' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 130, description: 'Blocco A 2' },
            { type: 'active', duration: 10, targetType: 'percent_ftp', targetValue: 100, description: 'Blocco B 2' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 130, description: 'Blocco A 3' },
            { type: 'active', duration: 10, targetType: 'percent_ftp', targetValue: 100, description: 'Blocco B 3' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 130, description: 'Blocco A 4' },
            { type: 'active', duration: 10, targetType: 'percent_ftp', targetValue: 100, description: 'Blocco B 4' },
            { type: 'active', duration: 30, targetType: 'percent_ftp', targetValue: 100, description: 'Finale blocco esteso' },
            { type: 'active', duration: 180, targetType: 'percent_ftp', targetValue: 55, description: 'Recupero tra i blocchi' },
            { type: 'cooldown', duration: 900, targetType: 'percent_ftp', targetValue: 50, description: 'Defaticamento' }
        ]
    }
];

export function getWorkouts(filter?: { category?: string; difficulty?: string; tag?: string }) {
    let workouts = WORKOUT_LIBRARY;
    if (filter?.category) {
        workouts = workouts.filter(w => w.category === filter.category);
    }
    if (filter?.difficulty) {
        workouts = workouts.filter(w => w.difficulty === filter.difficulty);
    }
    if (filter?.tag) {
        const tag = filter.tag;
        workouts = workouts.filter(w => w.tags.includes(tag));
    }
    return workouts;
}
