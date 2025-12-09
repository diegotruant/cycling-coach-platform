/**
 * Workout Generator - Main Generator
 * 
 * Orchestrates the creation of a workout based on:
 * - Target Physiological System (VO2max, Threshold, etc.)
 * - Athlete Profile (CP, pVO2max)
 * - Readiness (HRV Status)
 */

import { WORKOUT_LIBRARY, WorkoutTemplate } from './library';
import { modulateWorkout } from './modulators';
import { getDailyAdjustment } from '../planner/adaptive_logic';
import { TrafficLightStatus } from '../hrv/status';

export interface GeneratorInput {
    targetSystem: 'VO2MAX' | 'THRESHOLD' | 'RECOVERY';
    hrvStatus: TrafficLightStatus;
    athleteProfile: {
        cp: number;
        pVo2max: number;
    };
}

export function generateDailyWorkout(input: GeneratorInput): WorkoutTemplate {
    // 1. Select Base Template
    let templateId = '';
    switch (input.targetSystem) {
        case 'VO2MAX':
            templateId = 'vo2max_5x3';
            break;
        case 'THRESHOLD':
            templateId = 'threshold_2x20';
            break;
        case 'RECOVERY':
        default:
            templateId = 'recovery_spin';
            break;
    }

    const baseTemplate = WORKOUT_LIBRARY[templateId];

    // 2. Determine Adjustment based on Readiness
    const adjustment = getDailyAdjustment(input.hrvStatus);

    // 3. Modulate Workout
    const finalWorkout = modulateWorkout(baseTemplate, adjustment);

    return finalWorkout;
}
