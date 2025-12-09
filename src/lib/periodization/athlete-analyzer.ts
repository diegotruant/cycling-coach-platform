import { AthleteAnalysis, TrainingProtocol, ProtocolRecommendation } from './types';
import { ALL_PROTOCOLS } from './protocols';
import { getAthlete } from '@/lib/storage';
import { calculatePMC } from '@/lib/physiology/pmc';

export class AthleteAnalyzer {
    /**
     * Analizza lo stato completo di un atleta
     */
    async analyzeAthlete(athleteId: string): Promise<AthleteAnalysis> {
        const athlete = await getAthlete(athleteId);
        if (!athlete) {
            throw new Error('Atleta non trovato');
        }

        // Get recent assignments for PMC calculation
        const assignments = athlete.assignments || [];
        const recentAssignments = assignments
            .filter(a => a.status === 'COMPLETED')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 90); // Last 90 days

        // Calculate PMC
        const pmcData = calculatePMC(recentAssignments, athlete.ftp || 250);
        const latestPMC = pmcData[pmcData.length - 1];

        // Analyze HRV (mock for now - would come from daily HRV readings)
        const hrvAnalysis = this.analyzeHRV(athlete);

        // Calculate readiness score
        const readiness = this.calculateReadiness(hrvAnalysis, latestPMC);

        // Analyze recent performance
        const recentPerformance = this.analyzeRecentPerformance(recentAssignments);

        const analysis: AthleteAnalysis = {
            athleteId,
            analysisDate: new Date().toISOString(),

            hrv: hrvAnalysis,

            pmc: {
                ctl: latestPMC?.ctl || 0,
                atl: latestPMC?.atl || 0,
                tsb: latestPMC?.tsb || 0,
                formStatus: this.getFormStatus(latestPMC?.tsb || 0)
            },

            readiness,

            recent: recentPerformance,

            profile: {
                ftp: athlete.ftp || 250,
                maxHR: athlete.maxHR,
                weight: athlete.weight,
                experience: 'intermedio', // TODO: Get from athlete profile
                goals: [], // TODO: Get from athlete profile
                availableHoursPerWeek: 10, // TODO: Get from athlete profile
                daysPerWeek: 5 // TODO: Get from athlete profile
            },

            constraints: {
                // TODO: Get from athlete profile
            }
        };

        return analysis;
    }

    /**
     * Analizza HRV dell'atleta
     */
    private analyzeHRV(athlete: any) {
        // TODO: Get real HRV data from daily readings
        // For now, mock data
        const current = 65;
        const baseline = 70;
        const ratio = current / baseline;

        let status: 'green' | 'yellow' | 'red' | 'nfor';
        if (ratio >= 0.95) status = 'green';
        else if (ratio >= 0.85) status = 'yellow';
        else if (ratio >= 0.75) status = 'red';
        else status = 'nfor';

        return {
            current,
            baseline,
            status,
            trend: 'stable' as const,
            daysInStatus: 3
        };
    }

    /**
     * Calcola readiness score (0-100)
     */
    private calculateReadiness(hrv: any, pmc: any) {
        // HRV contribution (40%)
        const hrvRatio = hrv.current / hrv.baseline;
        const hrvScore = Math.min(100, hrvRatio * 100);
        const hrvContribution = hrvScore * 0.4;

        // TSB contribution (40%)
        const tsb = pmc?.tsb || 0;
        let tsbScore = 50;
        if (tsb > 10) tsbScore = 80; // Fresh
        else if (tsb > 0) tsbScore = 70; // Optimal
        else if (tsb > -15) tsbScore = 50; // Fatigued
        else tsbScore = 30; // Very fatigued
        const tsbContribution = tsbScore * 0.4;

        // Recent load contribution (20%)
        const recentLoadContribution = 50 * 0.2; // TODO: Calculate from recent TSS

        const totalScore = hrvContribution + tsbContribution + recentLoadContribution;

        return {
            score: Math.round(totalScore),
            factors: {
                hrvContribution: Math.round(hrvContribution),
                tsbContribution: Math.round(tsbContribution),
                recentLoadContribution: Math.round(recentLoadContribution)
            }
        };
    }

    /**
     * Determina form status da TSB
     */
    private getFormStatus(tsb: number): 'fresh' | 'optimal' | 'fatigued' | 'very_fatigued' {
        if (tsb > 10) return 'fresh';
        if (tsb > 0) return 'optimal';
        if (tsb > -15) return 'fatigued';
        return 'very_fatigued';
    }

    /**
     * Analizza performance recente
     */
    private analyzeRecentPerformance(assignments: any[]) {
        const last7Days = assignments.slice(0, 7);
        const weeklyTSS = last7Days.reduce((sum, a) => sum + (a.tss || 0), 0);

        return {
            weeklyTSS: [weeklyTSS],
            avgTSSPerWeek: weeklyTSS,
            completionRate: 85, // TODO: Calculate real completion rate
            powerCurveTrends: [] // TODO: Analyze power curve trends
        };
    }

    /**
     * Seleziona il protocollo migliore per l'atleta
     */
    selectProtocol(analysis: AthleteAnalysis): ProtocolRecommendation {
        const scores: { protocol: TrainingProtocol; score: number; rationale: string }[] = [];

        for (const protocol of ALL_PROTOCOLS) {
            let score = 0;
            const reasons: string[] = [];

            // Check TSB suitability
            if (analysis.pmc.tsb >= protocol.suitability.minTSB &&
                analysis.pmc.tsb <= protocol.suitability.maxTSB) {
                score += 30;
                reasons.push(`TSB (${analysis.pmc.tsb}) è nel range ottimale`);
            }

            // Check HRV status
            if (protocol.suitability.requiredHRVStatus.includes(analysis.hrv.status)) {
                score += 25;
                reasons.push(`HRV status (${analysis.hrv.status}) è compatibile`);
            } else {
                score -= 20;
                reasons.push(`HRV status (${analysis.hrv.status}) non è ideale`);
            }

            // Check readiness
            if (analysis.readiness.score >= protocol.suitability.minReadiness) {
                score += 25;
                reasons.push(`Readiness (${analysis.readiness.score}) è sufficiente`);
            } else {
                score -= 15;
                reasons.push(`Readiness (${analysis.readiness.score}) è bassa`);
            }

            // Check experience level
            if (protocol.suitability.experienceLevel.includes(analysis.profile.experience)) {
                score += 20;
                reasons.push(`Livello esperienza compatibile`);
            }

            scores.push({
                protocol,
                score: Math.max(0, Math.min(100, score)),
                rationale: reasons.join('. ')
            });
        }

        // Sort by score
        scores.sort((a, b) => b.score - a.score);

        const best = scores[0];
        const alternatives = scores.slice(1, 3).map(s => ({
            protocol: s.protocol,
            reason: s.rationale
        }));

        return {
            protocol: best.protocol,
            score: best.score,
            rationale: best.rationale,
            alternatives
        };
    }
}
