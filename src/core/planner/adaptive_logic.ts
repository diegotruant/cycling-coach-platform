/**
 * Adaptive Planner - Logic Engine
 * 
 * Adjusts training plan based on athlete's readiness (HRV Status).
 */

import { TrafficLightStatus } from '../hrv/status';

export interface WorkoutAdjustment {
    action: 'KEEP' | 'REDUCE_VOLUME' | 'REDUCE_INTENSITY' | 'REST' | 'RECOVERY_RIDE';
    intensityFactor: number; // 1.0 = 100%
    volumeFactor: number; // 1.0 = 100%
    restIncreaseFactor: number; // 1.0 = no change, 1.5 = +50% rest duration
    reason: string;
}

export function getDailyAdjustment(hrvStatus: TrafficLightStatus, additionalSignals: string[] = []): WorkoutAdjustment {
    // Check for multiple negative signals
    // "Se 2+ segnali negativi: recovery day/week"
    // Assuming 'additionalSignals' contains flags like 'POOR_SLEEP', 'HIGH_RPE', 'SORE_LEGS'
    const negativeSignalsCount = (hrvStatus !== 'GREEN' ? 1 : 0) + additionalSignals.length;

    if (negativeSignalsCount >= 2 || hrvStatus === 'RED') {
        // Force Recovery
        return {
            action: 'RECOVERY_RIDE',
            intensityFactor: 0.60, // Z1/Z2 only
            volumeFactor: 0.50, // Short duration
            restIncreaseFactor: 1.0,
            reason: hrvStatus === 'RED'
                ? 'HRV Status is RED. High physiological stress detected.'
                : 'Multiple negative readiness signals detected.'
        };
    }

    if (hrvStatus === 'YELLOW') {
        // "Se Giallo: riduci volume 20–30%, aumentare recuperi in workout intensi"
        return {
            action: 'REDUCE_VOLUME',
            intensityFactor: 0.95, // Slight intensity reduction (-5% as per workout generator logic)
            volumeFactor: 0.75, // Reduce by 25% (midpoint of 20-30%)
            restIncreaseFactor: 1.33, // Increase rest (e.g., 3min -> 4min is +33%)
            reason: 'HRV Status is YELLOW. Reducing load to prevent overreaching.'
        };
    }

    // GREEN
    return {
        action: 'KEEP',
        intensityFactor: 1.0,
        volumeFactor: 1.0,
        restIncreaseFactor: 1.0,
        reason: 'HRV Status is GREEN. System ready for planned load.'
    };
}
