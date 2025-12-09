/**
 * HRV Engine - Baseline Calculator
 * 
 * Calculates the baseline (moving average) for HRV metrics.
 * Typically uses a 7-day or 60-day rolling average.
 */

export interface Baseline {
    mean: number;
    stdDev: number;
    count: number;
    days: number;
}

/**
 * Calculates baseline from a list of historical daily values.
 * @param values Array of daily metric values (e.g., RMSSD)
 * @param days Number of days to consider (e.g., 7)
 */
export function calculateBaseline(values: number[], days: number = 7): Baseline {
    // Take the last N values
    const recentValues = values.slice(-days);

    if (recentValues.length === 0) {
        return { mean: 0, stdDev: 0, count: 0, days };
    }

    const sum = recentValues.reduce((a, b) => a + b, 0);
    const mean = sum / recentValues.length;

    const squaredDiffs = recentValues.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / recentValues.length;
    const stdDev = Math.sqrt(variance);

    return {
        mean: parseFloat(mean.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(2)),
        count: recentValues.length,
        days
    };
}
