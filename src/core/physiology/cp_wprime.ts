/**
 * Physiology Engine - CP & W' Solver
 * 
 * Implements the Critical Power model solver.
 * Uses 2-parameter or 3-parameter models based on available test data.
 */

export interface PowerDurationPoint {
    duration: number; // seconds
    power: number; // Watts
}

export interface CPModelResult {
    cp: number; // Watts
    wPrime: number; // Joules
    error?: number; // Standard error estimate
}

/**
 * Solves CP and W' using the linear 1/time model (Power = W' * (1/t) + CP).
 * Requires at least 2 points (e.g., 3min and 12min).
 * Best with 3 points (e.g., 3min, 7min, 12min).
 */
export function solveCP2Parameter(points: PowerDurationPoint[]): CPModelResult | null {
    if (points.length < 2) return null;

    // Linear Regression: y = mx + c
    // y = Power
    // x = 1/time
    // m = W'
    // c = CP

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = points.length;

    for (const p of points) {
        const x = 1 / p.duration;
        const y = p.power;

        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Slope is W' (in Joules), Intercept is CP (in Watts)
    // Note: In P = W'/t + CP, slope is W'.

    return {
        cp: Math.round(intercept),
        wPrime: Math.round(slope)
    };
}

/**
 * Solves CP using the Work-Time model (Work = CP * t + W').
 * Often more robust.
 */
export function solveCPWorkTime(points: PowerDurationPoint[]): CPModelResult | null {
    if (points.length < 2) return null;

    // Linear Regression: y = mx + c
    // y = Work (Power * time)
    // x = time
    // m = CP
    // c = W'

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = points.length;

    for (const p of points) {
        const x = p.duration;
        const y = p.power * p.duration; // Work

        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
        cp: Math.round(slope),
        wPrime: Math.round(intercept)
    };
}
