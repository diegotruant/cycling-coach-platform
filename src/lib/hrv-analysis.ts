/**
 * HRV Analysis Module - Evidence-Based Algorithms
 * Based on Dr. Gian Mario Migliaccio's protocols
 * 
 * Scientific References:
 * - Task Force ESC/NASPE (1996): HRV standards
 * - Plews et al. (2013): Training adaptation in elite athletes
 * - Buchheit (2014): Monitoring training status
 */

export type TrafficLightStatus = 'GREEN' | 'YELLOW' | 'RED';
export type OverreachingStatus = 'NORMAL' | 'FOR' | 'NFOR' | 'WARNING';

export interface HRVMetrics {
    rmssd: number;
    baseline: number;
    deviation: number; // Percentage from baseline
    trafficLight: TrafficLightStatus;
    recommendation: string;
}

export interface BaselineData {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    normalRange: { lower: number; upper: number };
    sampleSize: number;
}

export interface OverreachingAnalysis {
    status: OverreachingStatus;
    daysDepressed: number;
    averageDeviation: number;
    recommendation: string;
    severity: 'low' | 'medium' | 'high';
}

/**
 * Calculate dynamic baseline from recent HRV measurements
 * Standard: 7-30 day rolling average (Modulo 1, Capitolo 2)
 */
export function calculateBaseline(
    recentValues: number[],
    windowDays: number = 7
): BaselineData {
    if (recentValues.length < 3) {
        return {
            mean: 0,
            stdDev: 0,
            min: 0,
            max: 0,
            normalRange: { lower: 0, upper: 0 },
            sampleSize: 0
        };
    }

    // Use most recent windowDays values
    const window = recentValues.slice(-windowDays);
    const mean = window.reduce((sum, val) => sum + val, 0) / window.length;

    // Standard deviation
    const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length;
    const stdDev = Math.sqrt(variance);

    // Normal range: ±10% from baseline (evidence-based threshold)
    const normalRange = {
        lower: mean * 0.90,
        upper: mean * 1.10
    };

    return {
        mean: Math.round(mean * 10) / 10,
        stdDev: Math.round(stdDev * 10) / 10,
        min: Math.min(...window),
        max: Math.max(...window),
        normalRange,
        sampleSize: window.length
    };
}

/**
 * Traffic Light System (Modulo 2, Capitolo 2)
 * 
 * GREEN: HRV ≥ baseline OR +5% → Proceed with intense training
 * YELLOW: HRV -10% to -15% → Reduce volume/intensity 20-30%
 * RED: HRV < -15% OR 3+ days depressed → Recovery/Rest
 */
export function calculateTrafficLight(
    current: number,
    baseline: number
): { status: TrafficLightStatus; deviation: number } {
    if (baseline === 0) {
        return { status: 'YELLOW', deviation: 0 };
    }

    const deviation = ((current - baseline) / baseline) * 100;

    let status: TrafficLightStatus;
    if (deviation >= -5) {
        status = 'GREEN';
    } else if (deviation >= -15) {
        status = 'YELLOW';
    } else {
        status = 'RED';
    }

    return { status, deviation: Math.round(deviation * 10) / 10 };
}

/**
 * Generate evidence-based recommendation based on traffic light status
 * (Modulo 2, Capitolo 2: "Soglie Decisionali e Protocolli di Modulazione")
 */
export function getTrafficLightRecommendation(
    status: TrafficLightStatus,
    deviation: number,
    daysDepressed: number = 0
): string {
    switch (status) {
        case 'GREEN':
            return deviation > 5
                ? '🟢 Ottimo! HRV elevata - Finestra ottimale per allenamento intenso. Considera di capitalizzare questa supercompensazione.'
                : '🟢 Pronto per allenarsi - Sistema parasimpatico recuperato. Procedi con sessione pianificata.';

        case 'YELLOW':
            return daysDepressed >= 2
                ? `🟠 Attenzione: HRV ridotta per ${daysDepressed} giorni. Riduci volume/intensità del 20-30%. Sostituisci interval con Z2 aerobico.`
                : '🟠 HRV leggermente depressa - Modula sessione: riduci volume 20% o intensità al 90% della soglia. Aumenta recupero tra ripetizioni.';

        case 'RED':
            return daysDepressed >= 3
                ? `🔴 ALERT: Pattern depresso ${daysDepressed} giorni consecutivi. Possibile NFOR. Settimana scarico: volume -40-60%, solo Z1-Z2.`
                : '🔴 Sistema parasimpatico soppresso - Annulla sessione intensa. Recupero attivo 60min Z1 o riposo completo. Indaga: sonno, stress, nutrizione.';
    }
}

/**
 * Analyze overreaching status based on HRV pattern
 * (Modulo 2, Capitolo 3: "Identificazione di Overreaching Funzionale e Non-Funzionale")
 * 
 * FOR (Functional Overreaching): HRV depressed 3-10 days, recovers with taper
 * NFOR (Non-Functional): HRV depressed >14-21 days, performance decline
 */
export function analyzeOverreaching(
    recentEntries: Array<{ date: string; hrv?: number; rhr?: number }>,
    baseline: number
): OverreachingAnalysis {
    const validEntries = recentEntries
        .filter(e => e.hrv && e.hrv > 0)
        .slice(-21); // Last 3 weeks

    if (validEntries.length < 5 || baseline === 0) {
        return {
            status: 'NORMAL',
            daysDepressed: 0,
            averageDeviation: 0,
            recommendation: 'Dati insufficienti per analisi. Continua monitoraggio quotidiano.',
            severity: 'low'
        };
    }

    // Count consecutive days with HRV < -15% from baseline
    let consecutiveDays = 0;
    let maxConsecutive = 0;
    let depressedSum = 0;
    let depressedCount = 0;

    for (let i = validEntries.length - 1; i >= 0; i--) {
        const entry = validEntries[i];
        const deviation = ((entry.hrv! - baseline) / baseline) * 100;

        if (deviation < -15) {
            consecutiveDays++;
            depressedSum += deviation;
            depressedCount++;
            maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
        } else if (i === validEntries.length - 1) {
            // Not currently depressed
            break;
        } else {
            consecutiveDays = 0;
        }
    }

    const averageDeviation = depressedCount > 0
        ? Math.round((depressedSum / depressedCount) * 10) / 10
        : 0;

    // Determine status
    let status: OverreachingStatus;
    let recommendation: string;
    let severity: 'low' | 'medium' | 'high';

    if (maxConsecutive === 0) {
        status = 'NORMAL';
        severity = 'low';
        recommendation = 'Recupero normale. Continua monitoraggio HRV quotidiano.';
    } else if (maxConsecutive >= 1 && maxConsecutive <= 2) {
        status = 'WARNING';
        severity = 'medium';
        recommendation = `HRV depressa ${maxConsecutive} giorni. Monitora attentamente. Se persiste 3+ giorni, riduci carico.`;
    } else if (maxConsecutive >= 3 && maxConsecutive <= 10) {
        status = 'FOR';
        severity = 'medium';
        recommendation = `Functional Overreaching: ${maxConsecutive} giorni HRV depressa. Programma scarico 7-14 giorni (volume -40%, intensità moderata). Dovrebbe recuperare.`;
    } else if (maxConsecutive >= 11 && maxConsecutive <= 21) {
        status = 'NFOR';
        severity = 'high';
        recommendation = `⚠️ Non-Functional Overreaching: ${maxConsecutive} giorni HRV persistentemente bassa. STOP allenamenti intensi. Scarico 4-6 settimane. Consulta medico sportivo se performance peggiora.`;
    } else {
        status = 'NFOR';
        severity = 'high';
        recommendation = `🚨 ALERT CRITICO: HRV depressa >3 settimane. Possibile Overtraining Syndrome. CONSULTARE MEDICO SPORTIVO immediatamente. Riposo prolungato necessario.`;
    }

    return {
        status,
        daysDepressed: maxConsecutive,
        averageDeviation,
        recommendation,
        severity
    };
}

/**
 * Calculate HRV trend over period
 * Useful for tapering assessment and long-term monitoring
 */
export function calculateTrend(
    values: number[],
    periodDays: number = 14
): { trend: 'increasing' | 'stable' | 'decreasing'; percentage: number } {
    if (values.length < periodDays) {
        return { trend: 'stable', percentage: 0 };
    }

    const recent = values.slice(-periodDays);
    const firstHalf = recent.slice(0, Math.floor(periodDays / 2));
    const secondHalf = recent.slice(Math.floor(periodDays / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const percentChange = ((avgSecond - avgFirst) / avgFirst) * 100;

    let trend: 'increasing' | 'stable' | 'decreasing';
    if (percentChange > 5) {
        trend = 'increasing';
    } else if (percentChange < -5) {
        trend = 'decreasing';
    } else {
        trend = 'stable';
    }

    return { trend, percentage: Math.round(percentChange * 10) / 10 };
}

/**
 * Validate HRV measurement quality based on protocol adherence
 * (Modulo 1, Capitolo 3: "Standardizzazione delle Misurazioni HRV")
 */
export interface MeasurementQuality {
    isValid: boolean;
    warnings: string[];
    score: number; // 0-100
}

export function validateMeasurement(
    hrv: number,
    measurementTime?: string, // HH:MM format
    position?: 'supine' | 'sitting' | 'standing',
    duration?: number // minutes
): MeasurementQuality {
    const warnings: string[] = [];
    let score = 100;

    // HRV value sanity check
    if (hrv < 10 || hrv > 200) {
        warnings.push('⚠️ Valore HRV anomalo. Verifica correttezza misurazione e sensore ECG.');
        score -= 40;
    }

    // Timing check (should be within 10min of waking)
    if (measurementTime) {
        const [hours] = measurementTime.split(':').map(Number);
        if (hours > 10) {
            warnings.push('⚠️ Misurazione tardiva. Preferibile entro 10min dal risveglio per dati stabili.');
            score -= 15;
        }
    }

    // Position check
    if (position && position !== 'supine') {
        warnings.push('⚠️ Posizione non standard. Gold standard: supino al risveglio. Valori non comparabili.');
        score -= 20;
    }

    // Duration check
    if (duration && duration < 3) {
        warnings.push('⚠️ Durata insufficiente (<3min). Minimo raccomandato: 5min per stabilità statistica.');
        score -= 25;
    }

    return {
        isValid: score >= 60,
        warnings,
        score: Math.max(0, score)
    };
}
