/**
 * Physiology Engine - VO2max & pVO2max
 * 
 * Calculations for VO2max estimation and Power at VO2max (pVO2max).
 */

export interface VO2Profile {
    vo2max: number; // ml/kg/min
    pVo2max: number; // Watts
    source: 'LAB' | 'ESTIMATED';
}

/**
 * Estimates VO2max from Max Power (MAP) obtained in a Ramp Test.
 * Formula: VO2max (L/min) ~= (0.0108 x Watts) + 0.007 x BodyMass
 * Or simpler cycling estimation: VO2max = (10.8 * W / Mass) + 7
 * 
 * @param map Maximal Aerobic Power (Watts) from Ramp Test
 * @param weight Body weight (kg)
 */
export function estimateVO2maxFromRamp(map: number, weight: number): number {
    // ACSM metabolic equation for cycling (approximate)
    // VO2 (ml/kg/min) = (1.8 * WorkRate) / BodyMass + 7
    // WorkRate in kgm/min. 1 Watt = 6.12 kgm/min

    // Simpler Hawley & Noakes (1992):
    // VO2max (L/min) = 0.01141 * Wpeak + 0.435

    const vo2maxLiters = 0.01141 * map + 0.435;
    const vo2maxRelative = (vo2maxLiters * 1000) / weight;

    return parseFloat(vo2maxRelative.toFixed(1));
}

/**
 * Calculates pVO2max (Power at VO2max).
 * Often assumed to be the MAP from a standard Ramp Test (20-30W/min).
 * Or derived from 5-min max effort (approx 105-110% of pVO2max depending on anaerobic contribution).
 * 
 * @param fiveMinPower Best 5-minute power
 */
export function estimatePVO2maxFrom5Min(fiveMinPower: number): number {
    // 5-min power is typically slightly above pVO2max due to anaerobic capacity
    // A common estimation is pVO2max ~= 0.95 * 5minPower (very rough)
    // Or simply assume 5min power IS close to pVO2max for practical purposes
    // Let's use a conservative 95% estimate
    return Math.round(fiveMinPower * 0.95);
}
