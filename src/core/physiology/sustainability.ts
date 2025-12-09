/**
 * Physiology Engine - VO2 Sustainability
 * 
 * Models the sustainability of %VO2max efforts.
 * %VO2(duration) = f(VO2max, pVO2max, t_lim, LT2, CP, efficiency)
 */

/**
 * Calculates the sustainable power for a given duration based on the Power Duration Curve derived from CP/W'.
 * This is a simplification of the %VO2 sustainability model but serves the same purpose for power-based training.
 * 
 * @param duration Duration in seconds
 * @param cp Critical Power
 * @param wPrime W'
 */
export function calculateSustainablePower(duration: number, cp: number, wPrime: number): number {
    // Hyperbolic model: P(t) = CP + W'/t
    if (duration <= 0) return 0;
    return Math.round(cp + (wPrime / duration));
}

/**
 * Calculates the estimated %VO2max utilization for a given power output.
 * Assumes linear relationship between Power and VO2 below VO2max.
 * 
 * @param power Target Power
 * @param pVo2max Power at VO2max
 */
export function estimatePercentVO2(power: number, pVo2max: number): number {
    if (pVo2max === 0) return 0;
    return Math.min(100, Math.round((power / pVo2max) * 100));
}
