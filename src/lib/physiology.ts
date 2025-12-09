import { FitDataPoint } from './fit-parser';

export interface PowerDurationPoint {
    duration: number; // seconds
    watts: number;
}

export interface PhysiologicalMetrics {
    cp: number;
    w_prime: number;
    p_max: number;
    ftp: number;
    map: number;
    riderProfile: 'SPRINTER' | 'CLIMBER' | 'ALL_ROUNDER' | 'TIME_TRIALIST';
    bmi: number;
}

/**
 * Calculates the Mean Maximal Power (MMP) for a given duration from activity data.
 * Uses a moving average algorithm.
 */
export function calculateMMP(data: FitDataPoint[], durationSeconds: number): number {
    if (!data || data.length === 0) return 0;

    // Filter out null power values
    const powerData = data.map(d => d.power || 0);

    if (durationSeconds > powerData.length) return 0;

    let maxSum = 0;
    let currentSum = 0;

    // Initial window
    for (let i = 0; i < durationSeconds; i++) {
        currentSum += powerData[i];
    }
    maxSum = currentSum;

    // Slide window
    for (let i = durationSeconds; i < powerData.length; i++) {
        currentSum = currentSum - powerData[i - durationSeconds] + powerData[i];
        if (currentSum > maxSum) {
            maxSum = currentSum;
        }
    }

    return Math.round(maxSum / durationSeconds);
}

/**
 * Calculates Critical Power (CP) and W' using the 2-parameter linear model (Work vs Time).
 * Work = CP * t + W'
 * Slope = CP, Intercept = W'
 * Requires at least 2 points (e.g., CP3, CP12).
 */
export function calculateCPandWprime(tests: PowerDurationPoint[]): { cp: number; w_prime: number } {
    if (tests.length < 2) {
        throw new Error("At least 2 test points are required to calculate CP and W'.");
    }

    // Convert to Work (Joules) vs Time (Seconds)
    // x = time, y = work (power * time)
    const points = tests.map(t => ({
        x: t.duration,
        y: t.watts * t.duration
    }));

    // Simple Linear Regression (Least Squares)
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (const p of points) {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumXX += p.x * p.x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
        cp: Math.round(slope),
        w_prime: Math.round(intercept) // Joules
    };
}

/**
 * Estimates Pmax from peak 1-second power.
 */
export function estimatePmax(data: FitDataPoint[]): number {
    return calculateMMP(data, 1);
}

/**
 * Calculates BMI.
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
    if (!weightKg || !heightCm) return 0;
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

/**
 * Determines Rider Profile (Profilo Ciclistico) based on Power Profile.
 * Simplified logic based on Pmax/FTP ratio and W'.
 */
export function determineRiderProfile(
    pmax: number,
    ftp: number,
    w_prime: number | undefined,
    vlamax?: number,
    apr?: number
): PhysiologicalMetrics['riderProfile'] {
    if (!pmax || !ftp) return 'ALL_ROUNDER';

    // If VLaMax is available, use it as a primary determinant
    if (vlamax !== undefined) {
        if (vlamax >= 0.6) return 'SPRINTER';
        if (vlamax <= 0.3) return 'TIME_TRIALIST';
        // Between 0.3 and 0.6, check APR or W'
    }

    const sprintRatio = pmax / ftp;

    if (sprintRatio > 3.5) {
        return 'SPRINTER';
    } else if (sprintRatio < 2.0) {
        // Low sprint ratio could be Climber or TT
        // Check APR if available
        if (apr !== undefined && apr < 200) {
            return 'TIME_TRIALIST';
        }
        return 'CLIMBER';
    } else {
        // Check W' for further differentiation if available
        if (w_prime !== undefined) {
            if (w_prime > 25000) {
                return 'ALL_ROUNDER'; // High anaerobic capacity - versatile
            }
            return 'TIME_TRIALIST'; // Steady power, good for TT
        }

        // Fallback without W'
        if (sprintRatio > 2.8) return 'SPRINTER';
        return 'ALL_ROUNDER';
    }
}

/**
 * Estimates VLAmax (Maximal glycolytic rate) based on sprint and CP data.
 * VLAmax ≈ (Pmax - CP) / k, where k is a constant (~0.2).
 * This is a simplified estimation.
 */
export function estimateVLAmax(pmax: number, cp: number): number {
    if (!pmax || !cp) return 0;
    // Simplified estimation: VLaMax correlates with the difference between Peak Power and Threshold.
    // We use a scaling factor k=0.1 to map the watt difference to typical VLaMax ranges (0.2 - 0.8).
    // Example: (1000W - 300W) * 0.1 / 100 = 0.7 mmol/L/s (Sprinter)
    // Example: (600W - 280W) * 0.1 / 100 = 0.32 mmol/L/s (Endurance)
    const k = 0.1;
    return parseFloat(((pmax - cp) * k / 100).toFixed(2)); // mmol/L/s
}

/**
 * Calculates Anaerobic Power Reserve (APR).
 * APR = Pmax - MAP
 */
export function calculateAPR(pmax: number, map: number): number {
    if (!pmax || !map) return 0;
    return Math.round(pmax - map);
}

/**
 * Estimates Somatotype based on BMI and athlete profile.
 * Simplified classification:
 * - BMI < 20: Ectomorph (lean, endurance-oriented)
 * - BMI 20-25: Mesomorph (muscular, balanced)
 * - BMI > 25: Endomorph (heavier, power-oriented)
 */
export function estimateSomatotype(
    bmi: number,
    pmax?: number,
    ftp?: number
): string {
    if (!bmi) return 'Unknown';

    if (bmi < 20) {
        return 'Ectomorph';
    } else if (bmi >= 20 && bmi <= 25) {
        // Further differentiate based on power profile
        if (pmax && ftp) {
            const ratio = pmax / ftp;
            if (ratio > 3.0) {
                return 'Mesomorph (Sprint)';
            }
            return 'Mesomorph';
        }
        return 'Mesomorph';
    } else {
        return 'Endomorph';
    }
}


/**
 * Calculates Normalized Power (NP).
 * 1. Calculate 30s rolling average power.
 * 2. Raise values to the 4th power.
 * 3. Average the values.
 * 4. Take the 4th root.
 */
export function calculateNormalizedPower(data: FitDataPoint[]): number {
    if (!data || data.length < 30) return calculateMMP(data, data.length); // Fallback to avg power if too short

    const powerData = data.map(d => d.power || 0);
    const rollingAverages: number[] = [];

    // Calculate 30s rolling averages
    let currentSum = 0;
    for (let i = 0; i < 30; i++) {
        currentSum += powerData[i];
    }
    rollingAverages.push(currentSum / 30);

    for (let i = 30; i < powerData.length; i++) {
        currentSum = currentSum - powerData[i - 30] + powerData[i];
        rollingAverages.push(currentSum / 30);
    }

    // Raise to 4th power
    const fourthPowers = rollingAverages.map(p => Math.pow(p, 4));

    // Average
    const avgFourthPower = fourthPowers.reduce((a, b) => a + b, 0) / fourthPowers.length;

    // 4th root
    return Math.round(Math.pow(avgFourthPower, 0.25));
}

/**
 * Calculates Intensity Factor (IF).
 * IF = NP / FTP
 */
export function calculateIF(np: number, ftp: number): number {
    if (!ftp) return 0;
    return parseFloat((np / ftp).toFixed(2));
}

/**
 * Calculates Training Stress Score (TSS).
 * TSS = (sec x NP x IF) / (FTP x 3600) x 100
 */
export function calculateTSS(durationSeconds: number, np: number, if_factor: number, ftp: number): number {
    if (!ftp) return 0;
    return Math.round((durationSeconds * np * if_factor) / (ftp * 3600) * 100);
}
