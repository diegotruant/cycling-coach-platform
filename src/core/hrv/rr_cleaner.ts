/**
 * HRV Engine - RR Cleaner
 * 
 * Responsible for cleaning raw RR interval data.
 * Implements artifact detection and filtering.
 */

export interface CleaningResult {
    cleanedRR: number[];
    originalRR: number[];
    artifactsCount: number;
    artifactsPercentage: number;
    isValid: boolean; // True if artifacts < 5%
    warnings: string[];
}

export interface CleaningOptions {
    minRR: number; // ms, default 300
    maxRR: number; // ms, default 2000
    thresholdPercent: number; // %, default 20 (for quotient filter)
}

const DEFAULT_OPTIONS: CleaningOptions = {
    minRR: 300,
    maxRR: 2000,
    thresholdPercent: 20
};

export function cleanRRIntervals(rrIntervals: number[], options: Partial<CleaningOptions> = {}): CleaningResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const cleanedRR: number[] = [];
    let artifactsCount = 0;
    const warnings: string[] = [];

    if (!rrIntervals || rrIntervals.length === 0) {
        return {
            cleanedRR: [],
            originalRR: [],
            artifactsCount: 0,
            artifactsPercentage: 0,
            isValid: false,
            warnings: ['No RR intervals provided']
        };
    }

    // 1. Range Filter (Physiological limits)
    const rangeFiltered: number[] = [];
    for (const rr of rrIntervals) {
        if (rr >= opts.minRR && rr <= opts.maxRR) {
            rangeFiltered.push(rr);
        } else {
            artifactsCount++;
        }
    }

    // 2. Relative Filter (Sudden changes)
    // Simple approach: Compare with local median or previous valid beat
    // Using a simple quotient filter: 0.8 < RR(i) / RR(i-1) < 1.2

    if (rangeFiltered.length > 0) {
        cleanedRR.push(rangeFiltered[0]); // Keep first valid beat

        for (let i = 1; i < rangeFiltered.length; i++) {
            const curr = rangeFiltered[i];
            const prev = cleanedRR[cleanedRR.length - 1];

            const ratio = curr / prev;
            const threshold = opts.thresholdPercent / 100;

            if (ratio < (1 - threshold) || ratio > (1 + threshold)) {
                // Artifact detected
                artifactsCount++;
                // Strategy: Skip (could also interpolate)
            } else {
                cleanedRR.push(curr);
            }
        }
    }

    const totalBeats = rrIntervals.length;
    const artifactsPercentage = (artifactsCount / totalBeats) * 100;
    const isValid = artifactsPercentage < 5;

    if (!isValid) {
        warnings.push(`High artifact rate: ${artifactsPercentage.toFixed(1)}% (Threshold: 5%)`);
    }

    if (cleanedRR.length < 30) { // Minimum beats for valid HRV
        warnings.push('Insufficient clean beats for reliable HRV analysis');
    }

    return {
        cleanedRR,
        originalRR: rrIntervals,
        artifactsCount,
        artifactsPercentage,
        isValid,
        warnings
    };
}
