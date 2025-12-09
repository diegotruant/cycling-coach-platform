/**
 * Physiology Engine - Tlim Model
 * 
 * Models the Time to Exhaustion (Tlim) at pVO2max.
 * Range: typically 2-10 minutes.
 * Updated after intensive sessions.
 */

/**
 * Estimates Tlim at pVO2max based on CP and W'.
 * Tlim = W' / (pVO2max - CP)
 * 
 * @param pVo2max Power at VO2max (Watts)
 * @param cp Critical Power (Watts)
 * @param wPrime W' (Joules)
 */
export function calculateTlimAtPVO2max(pVo2max: number, cp: number, wPrime: number): number {
    if (pVo2max <= cp) {
        return 3600; // Theoretically infinite (or very long) if below CP
    }

    const tlimSeconds = wPrime / (pVo2max - cp);
    return Math.round(tlimSeconds);
}

/**
 * Updates Tlim based on a recent max effort at pVO2max intensity.
 * @param currentTlim Current estimated Tlim (seconds)
 * @param actualDuration Duration of recent failure effort at pVO2max (seconds)
 */
export function updateTlim(currentTlim: number, actualDuration: number): number {
    // Simple weighted update
    // New Tlim = 70% Old + 30% New (conservative update)
    return Math.round((currentTlim * 0.7) + (actualDuration * 0.3));
}
