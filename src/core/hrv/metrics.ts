/**
 * HRV Engine - Metrics Calculator
 * 
 * Calculates standard time-domain HRV metrics.
 */

import { CleaningResult } from './rr_cleaner';

export interface HRVMetrics {
    rmssd: number; // Root Mean Square of Successive Differences (ms)
    sdnn: number;  // Standard Deviation of NN intervals (ms)
    pnn50: number; // Percentage of successive RR intervals that differ by more than 50 ms (%)
    cv: number;    // Coefficient of Variation (%)
    meanRR: number; // Mean RR interval (ms)
    heartRate: number; // Mean Heart Rate (bpm)
}

export function calculateHRVMetrics(cleaningResult: CleaningResult): HRVMetrics | null {
    const rr = cleaningResult.cleanedRR;

    if (!rr || rr.length < 2) {
        return null;
    }

    // Mean RR
    const sumRR = rr.reduce((a, b) => a + b, 0);
    const meanRR = sumRR / rr.length;

    // Heart Rate
    const heartRate = 60000 / meanRR;

    // SDNN
    const squaredDiffs = rr.map(val => Math.pow(val - meanRR, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / rr.length;
    const sdnn = Math.sqrt(variance);

    // CV
    const cv = (sdnn / meanRR) * 100;

    // RMSSD & pNN50
    let sumSquaredSuccessiveDiffs = 0;
    let nn50Count = 0;

    for (let i = 0; i < rr.length - 1; i++) {
        const diff = Math.abs(rr[i + 1] - rr[i]);

        sumSquaredSuccessiveDiffs += Math.pow(diff, 2);

        if (diff > 50) {
            nn50Count++;
        }
    }

    const rmssd = Math.sqrt(sumSquaredSuccessiveDiffs / (rr.length - 1));
    const pnn50 = (nn50Count / (rr.length - 1)) * 100;

    return {
        rmssd: parseFloat(rmssd.toFixed(2)),
        sdnn: parseFloat(sdnn.toFixed(2)),
        pnn50: parseFloat(pnn50.toFixed(1)),
        cv: parseFloat(cv.toFixed(1)),
        meanRR: parseFloat(meanRR.toFixed(0)),
        heartRate: parseFloat(heartRate.toFixed(0))
    };
}
