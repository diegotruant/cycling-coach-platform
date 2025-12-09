/**
 * Workout Generator - Library
 * 
 * Base definitions for workout types.
 */

export interface WorkoutTemplate {
    id: string;
    name: string;
    type: 'VO2MAX' | 'THRESHOLD' | 'TEMPO' | 'ENDURANCE' | 'RECOVERY' | 'ANAEROBIC';
    description: string;
    intervals: {
        type: 'WORK' | 'REST' | 'WARMUP' | 'COOLDOWN';
        duration: string; // e.g., "3min", "60s", "10min"
        intensity: string; // e.g., "95-100% pVO2max", "90% CP", "Z2"
        target?: string;
    }[];
}

export const WORKOUT_LIBRARY: Record<string, WorkoutTemplate> = {
    'vo2max_5x3': {
        id: 'vo2max_5x3',
        name: 'VO2max Intervals 5x3min',
        type: 'VO2MAX',
        description: 'Classic VO2max development session. Target high oxygen uptake.',
        intervals: [
            { type: 'WARMUP', duration: '15min', intensity: '50-60% CP' },
            { type: 'WORK', duration: '3min', intensity: '95-100% pVO2max', target: 'Reach VO2max' },
            { type: 'REST', duration: '3min', intensity: '50% CP' },
            { type: 'WORK', duration: '3min', intensity: '95-100% pVO2max' },
            { type: 'REST', duration: '3min', intensity: '50% CP' },
            { type: 'WORK', duration: '3min', intensity: '95-100% pVO2max' },
            { type: 'REST', duration: '3min', intensity: '50% CP' },
            { type: 'WORK', duration: '3min', intensity: '95-100% pVO2max' },
            { type: 'REST', duration: '3min', intensity: '50% CP' },
            { type: 'WORK', duration: '3min', intensity: '95-100% pVO2max' },
            { type: 'COOLDOWN', duration: '15min', intensity: '40-50% CP' }
        ]
    },
    'threshold_2x20': {
        id: 'threshold_2x20',
        name: 'Threshold 2x20min',
        type: 'THRESHOLD',
        description: 'Sustained effort at FTP/CP to improve lactate clearance.',
        intervals: [
            { type: 'WARMUP', duration: '15min', intensity: '60% CP' },
            { type: 'WORK', duration: '20min', intensity: '95-100% CP' },
            { type: 'REST', duration: '5min', intensity: '50% CP' },
            { type: 'WORK', duration: '20min', intensity: '95-100% CP' },
            { type: 'COOLDOWN', duration: '15min', intensity: '50% CP' }
        ]
    },
    'recovery_spin': {
        id: 'recovery_spin',
        name: 'Active Recovery',
        type: 'RECOVERY',
        description: 'Easy spin to promote blood flow without stress.',
        intervals: [
            { type: 'WORK', duration: '45min', intensity: '45-55% CP' }
        ]
    }
};
