export interface PowerEffort {
    duration: number; // seconds
    power: number; // watts
}

export interface CPMetrics {
    cp: number;
    wPrime: number;
    r2: number; // Quality of fit
}

/**
 * Calculates Critical Power and W' using the linear Work-Time model.
 * Work = CP * Time + W'
 * y = mx + c
 * y = Work (Joules)
 * x = Time (Seconds)
 * m = CP
 * c = W'
 */
export function calculateCP_WPrime(efforts: PowerEffort[]): CPMetrics | null {
    if (efforts.length < 2) return null;

    // Sort by duration
    const sorted = [...efforts].sort((a, b) => a.duration - b.duration);

    // Filter for relevant durations (e.g., 2min to 20min) for better CP estimation
    // CP is best estimated with efforts between 3 and 20 minutes.
    const validEfforts = sorted.filter(e => e.duration >= 180 && e.duration <= 1200);

    if (validEfforts.length < 2) {
        // Fallback: if we only have short efforts, we can't calculate CP reliably.
        // If we have longer efforts (e.g. 20m and 60m), we can use them but W' might be underestimated.
        return null;
    }

    const n = validEfforts.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (const e of validEfforts) {
        const x = e.duration;
        const y = e.power * e.duration; // Work in Joules

        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R-squared calculation
    const meanY = sumY / n;
    let ssTot = 0;
    let ssRes = 0;
    for (const e of validEfforts) {
        const x = e.duration;
        const y = e.power * e.duration;
        const yPred = slope * x + intercept;
        ssTot += (y - meanY) ** 2;
        ssRes += (y - yPred) ** 2;
    }
    const r2 = 1 - (ssRes / ssTot);

    return {
        cp: Math.round(slope),
        wPrime: Math.round(intercept),
        r2
    };
}

export function estimatePmax(powerCurve: number[]): number {
    // Assuming powerCurve index is seconds-1 (index 0 = 1s)
    if (powerCurve.length === 0) return 0;
    return Math.max(...powerCurve.slice(0, 5)); // Max of first 5 seconds
}
