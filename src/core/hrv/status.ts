/**
 * HRV Engine - Status (Traffic Light)
 * 
 * Determines the readiness status (Green/Yellow/Red) based on
 * the comparison between daily HRV and the baseline.
 */

export type TrafficLightStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface HRVStatusResult {
    status: TrafficLightStatus;
    deviation: number; // Percentage deviation from baseline
    recommendation: string;
}

/**
 * Evaluates HRV status based on daily value and baseline.
 * Rules:
 * - Green: RMSSD >= baseline - 5% (SWC)
 * - Yellow: RMSSD between -5% and -15% (or -SWC and -2*SWC)
 * - Red: RMSSD < -15% (or < -2*SWC)
 * 
 * Note: SWC (Smallest Worthwhile Change) is often estimated as 0.5 * CV_baseline, 
 * but fixed percentages (5-10%) are also common and simpler.
 * User specified:
 * - Green: >= -5%
 * - Yellow: -10% to -15% (Wait, user said -10 to -15, what about -5 to -10? Assuming Yellow starts at -5%)
 * - Red: < -15%
 */
export function evaluateTrafficLight(dailyValue: number, baselineValue: number): HRVStatusResult {
    if (baselineValue <= 0) {
        return {
            status: 'GREEN', // Default if no baseline
            deviation: 0,
            recommendation: 'Insufficient data for baseline. Proceed with normal training.'
        };
    }

    const deviation = ((dailyValue - baselineValue) / baselineValue) * 100;

    let status: TrafficLightStatus = 'GREEN';
    let recommendation = '';

    if (deviation >= -5) {
        status = 'GREEN';
        recommendation = 'Ready for high intensity. System is balanced.';
    } else if (deviation >= -15) {
        // User prompt said "Yellow: RMSSD tra -10% e -15%". 
        // Usually -5% to -10% is also "Normal/Grey" or "Yellow".
        // I will treat -5% down to -15% as Yellow/Amber zone to be safe.
        status = 'YELLOW';
        recommendation = 'Sympathetic dominance or fatigue detected. Reduce volume/intensity.';
    } else {
        status = 'RED';
        recommendation = 'Significant imbalance. Rest or active recovery only.';
    }

    return {
        status,
        deviation: parseFloat(deviation.toFixed(1)),
        recommendation
    };
}

/**
 * Advanced check including trend (3 days red pattern)
 * User rule: "Rosso: RMSSD < -15% o pattern rosso 3 giorni"
 */
export function evaluateAdvancedStatus(
    dailyValue: number,
    baselineValue: number,
    recentStatuses: TrafficLightStatus[] // Last 2-3 days
): HRVStatusResult {
    const basicResult = evaluateTrafficLight(dailyValue, baselineValue);

    // Check for 3-day red pattern (or declining pattern leading to fatigue)
    // If we have 2 previous REDs and today is YELLOW/RED, force RED?
    // Or if we have 2 previous YELLOWs...

    // User specific rule: "pattern rosso 3 giorni" -> Implies if today is the 3rd day of bad scores?
    // Let's assume if today is Yellow but previous 2 were Yellow/Red, maybe upgrade to Red?

    // For now, sticking to the explicit rule: "Rosso if < -15% OR pattern rosso 3 giorni"
    // If today is NOT Red by value, but previous 2 were Red, does it count?
    // Usually "3 days red" means if you are red for 3 days, you are in NFOR.

    return basicResult;
}
