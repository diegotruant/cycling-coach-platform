import { Mesocycle, AthleteAnalysis, TrainingProtocol, WeekStructure, MesocycleWorkout } from './types';
import { AthleteAnalyzer } from './athlete-analyzer';
import { WorkoutGenerator } from '../ai/workout-generator';
import { WorkoutGenerationParams } from '../ai/types';

export class MesocycleGenerator {
    private analyzer: AthleteAnalyzer;
    private workoutGenerator: WorkoutGenerator | null;

    constructor(aiApiKey?: string) {
        this.analyzer = new AthleteAnalyzer();
        this.workoutGenerator = aiApiKey ? new WorkoutGenerator(aiApiKey, 'gemini') : null;
    }

    /**
     * Genera un mesociclo completo per un atleta
     */
    async generateMesocycle(
        athleteId: string,
        coachId: string,
        options?: {
            weeks?: number;
            forceProtocol?: string;
        }
    ): Promise<Mesocycle> {
        // 1. Analyze athlete
        const analysis = await this.analyzer.analyzeAthlete(athleteId);

        // 2. Select protocol
        const recommendation = this.analyzer.selectProtocol(analysis);
        const protocol = options?.forceProtocol
            ? await this.getProtocolById(options.forceProtocol)
            : recommendation.protocol;

        if (!protocol) {
            throw new Error('Protocollo non trovato');
        }

        // 3. Determine duration
        const weeks = options?.weeks || protocol.duration.typical;

        // 4. Generate weekly structure
        const weeklyStructure = await this.generateWeeklyStructure(
            protocol,
            analysis,
            weeks
        );

        // 5. Create mesocycle
        const mesocycle: Mesocycle = {
            id: `meso_${Date.now()}`,
            athleteId,
            coachId,
            name: `${protocol.name} - ${weeks} settimane`,
            description: protocol.description,
            startDate: new Date().toISOString().split('T')[0],
            endDate: this.calculateEndDate(weeks),
            weeks,
            protocol: {
                id: protocol.id,
                name: protocol.name,
                rationale: recommendation.rationale || 'Protocollo selezionato manualmente',
                expectedAdaptations: protocol.adaptations
            },
            analysis,
            weeklyStructure,
            status: 'PENDING_APPROVAL'
        };

        return mesocycle;
    }

    /**
     * Genera la struttura settimanale del mesociclo
     */
    private async generateWeeklyStructure(
        protocol: TrainingProtocol,
        analysis: AthleteAnalysis,
        weeks: number
    ): Promise<WeekStructure[]> {
        const structure: WeekStructure[] = [];

        for (let week = 1; week <= weeks; week++) {
            const isRecoveryWeek = week === weeks || week % 4 === 0;
            const weekFocus = this.getWeekFocus(protocol, week, weeks);
            const targetTSS = this.calculateWeekTSS(protocol, week, weeks);

            // Generate workouts for this week
            const workouts = await this.generateWeekWorkouts(
                protocol,
                analysis,
                week,
                isRecoveryWeek
            );

            structure.push({
                week,
                focus: weekFocus,
                targetTSS,
                workouts
            });
        }

        return structure;
    }

    /**
     * Genera i workout per una settimana
     */
    private async generateWeekWorkouts(
        protocol: TrainingProtocol,
        analysis: AthleteAnalysis,
        week: number,
        isRecoveryWeek: boolean
    ): Promise<MesocycleWorkout[]> {
        const workouts: MesocycleWorkout[] = [];
        const sessionsPerWeek = isRecoveryWeek
            ? Math.max(3, protocol.weeklyStructure.sessionsPerWeek - 1)
            : protocol.weeklyStructure.sessionsPerWeek;

        // Distribute workouts across the week
        const workoutDays = this.distributeWorkoutDays(sessionsPerWeek);

        for (const day of workoutDays) {
            const workout = await this.generateSingleWorkout(
                protocol,
                analysis,
                day,
                isRecoveryWeek
            );
            workouts.push(workout);
        }

        return workouts;
    }

    /**
     * Genera un singolo workout
     */
    private async generateSingleWorkout(
        protocol: TrainingProtocol,
        analysis: AthleteAnalysis,
        dayOfWeek: number,
        isRecoveryWeek: boolean
    ): Promise<MesocycleWorkout> {
        // Determine workout type based on protocol and day
        const workoutType = this.determineWorkoutType(protocol, dayOfWeek, isRecoveryWeek);
        const duration = this.determineWorkoutDuration(protocol, workoutType, dayOfWeek);

        // If AI is available, use it to generate detailed workout
        if (this.workoutGenerator) {
            try {
                const params: WorkoutGenerationParams = {
                    athleteProfile: {
                        ftp: analysis.profile.ftp,
                        maxHR: analysis.profile.maxHR,
                        experience: analysis.profile.experience,
                        goals: analysis.profile.goals
                    },
                    workoutType,
                    duration,
                    specificInstructions: `Protocollo: ${protocol.name}. ${isRecoveryWeek ? 'Settimana di recupero.' : ''}`
                };

                const generated = await this.workoutGenerator.generate(params);

                return {
                    dayOfWeek,
                    name: generated.name,
                    description: generated.description,
                    duration: generated.duration,
                    tss: generated.tss,
                    type: workoutType,
                    intervals: generated.intervals as any,
                    coachNotes: generated.coachingNotes
                };
            } catch (error) {
                console.error('Error generating workout with AI:', error);
                // Fall back to template workout
            }
        }

        // Fallback: Generate template workout
        return this.generateTemplateWorkout(protocol, workoutType, duration, dayOfWeek);
    }

    /**
     * Genera un workout template (senza AI)
     */
    private generateTemplateWorkout(
        protocol: TrainingProtocol,
        workoutType: 'endurance' | 'soglia' | 'vo2max' | 'recupero' | 'sprint',
        duration: number,
        dayOfWeek: number
    ): MesocycleWorkout {
        // Simple template workouts
        const templates = {
            endurance: {
                name: 'Endurance Base',
                description: 'Uscita base aerobica in Zona 2',
                intervals: [
                    {
                        type: 'riscaldamento' as const,
                        duration: 600,
                        power: { min: 125, max: 175, target: 150 },
                        description: 'Riscaldamento progressivo'
                    },
                    {
                        type: 'lavoro' as const,
                        duration: (duration - 20) * 60,
                        power: { min: 162, max: 187, target: 175 },
                        description: 'Zona 2 costante (65-75% FTP)'
                    },
                    {
                        type: 'defaticamento' as const,
                        duration: 600,
                        power: { min: 100, max: 150, target: 125 },
                        description: 'Defaticamento graduale'
                    }
                ]
            },

            soglia: {
                name: 'Soglia (Threshold)',
                description: 'Lavoro alla soglia anaerobica',
                intervals: [
                    {
                        type: 'riscaldamento' as const,
                        duration: 900,
                        power: { min: 125, max: 175, target: 150 },
                        description: 'Riscaldamento'
                    },
                    {
                        type: 'lavoro' as const,
                        duration: 1200,
                        power: { min: 237, max: 262, target: 250 },
                        description: '20min @ FTP'
                    },
                    {
                        type: 'recupero' as const,
                        duration: 300,
                        power: { min: 100, max: 150, target: 125 },
                        description: 'Recupero'
                    },
                    {
                        type: 'lavoro' as const,
                        duration: 1200,
                        power: { min: 237, max: 262, target: 250 },
                        description: '20min @ FTP'
                    },
                    {
                        type: 'defaticamento' as const,
                        duration: 600,
                        power: { min: 100, max: 150, target: 125 },
                        description: 'Defaticamento'
                    }
                ]
            },
            vo2max: {
                name: 'VO2 Max Intervals',
                description: 'Intervalli ad alta intensità',
                intervals: [
                    {
                        type: 'riscaldamento' as const,
                        duration: 900,
                        power: { min: 125, max: 175, target: 150 },
                        description: 'Riscaldamento'
                    },
                    {
                        type: 'lavoro' as const,
                        duration: 180,
                        power: { min: 275, max: 300, target: 287 },
                        description: '3min @ 115% FTP'
                    },
                    {
                        type: 'recupero' as const,
                        duration: 180,
                        power: { min: 100, max: 150, target: 125 },
                        description: 'Recupero'
                    },
                    {
                        type: 'lavoro' as const,
                        duration: 180,
                        power: { min: 275, max: 300, target: 287 },
                        description: '3min @ 115% FTP'
                    },
                    {
                        type: 'defaticamento' as const,
                        duration: 600,
                        power: { min: 100, max: 150, target: 125 },
                        description: 'Defaticamento'
                    }
                ]
            },
            sprint: {
                name: 'Sprint Training',
                description: 'Sprint massimali',
                intervals: [
                    {
                        type: 'riscaldamento' as const,
                        duration: 1200,
                        power: { min: 125, max: 175, target: 150 },
                        description: 'Riscaldamento lungo'
                    },
                    {
                        type: 'lavoro' as const,
                        duration: 15,
                        power: { min: 500, max: 1000, target: 750 },
                        description: 'Sprint Max'
                    },
                    {
                        type: 'recupero' as const,
                        duration: 285,
                        power: { min: 100, max: 150, target: 125 },
                        description: 'Recupero completo'
                    },
                    {
                        type: 'defaticamento' as const,
                        duration: 600,
                        power: { min: 100, max: 150, target: 125 },
                        description: 'Defaticamento'
                    }
                ]
            },
            recupero: {
                name: 'Recupero Attivo',
                description: 'Pedalata leggera per recupero',
                intervals: [
                    {
                        type: 'lavoro' as const,
                        duration: duration * 60,
                        power: { min: 112, max: 150, target: 131 },
                        description: 'Zona 1 facile (45-55% FTP)'
                    }
                ]
            }
        };

        const template = templates[workoutType] || templates.endurance;

        return {
            dayOfWeek,
            name: template.name,
            description: template.description,
            duration,
            tss: this.estimateTSS(duration, workoutType),
            type: workoutType,
            intervals: template.intervals,
            coachNotes: `Workout generato da protocollo ${protocol.name}`
        };
    }

    // Helper methods
    private getProtocolById(id: string): TrainingProtocol | null {
        const { ALL_PROTOCOLS } = require('./protocols');
        return ALL_PROTOCOLS.find((p: TrainingProtocol) => p.id === id) || null;
    }

    private getWeekFocus(protocol: TrainingProtocol, week: number, totalWeeks: number): string {
        if (week === totalWeeks) return 'Recupero e consolidamento';
        if (week === 1) return 'Adattamento iniziale';
        if (week === totalWeeks - 1) return 'Carico massimo';
        return `Progressione ${protocol.name}`;
    }

    private calculateWeekTSS(protocol: TrainingProtocol, week: number, totalWeeks: number): number {
        const progression = protocol.tssProgression;
        if (week === 1) return progression.week1;
        if (week === 2) return progression.week2;
        if (week === 3) return progression.week3;
        return progression.week4;
    }

    private distributeWorkoutDays(sessions: number): number[] {
        // Distribute workouts across the week (0 = Sunday, 6 = Saturday)
        const days: number[] = [];
        if (sessions >= 1) days.push(1); // Monday
        if (sessions >= 2) days.push(3); // Wednesday
        if (sessions >= 3) days.push(5); // Friday
        if (sessions >= 4) days.push(6); // Saturday
        if (sessions >= 5) days.push(2); // Tuesday
        if (sessions >= 6) days.push(4); // Thursday
        return days.slice(0, sessions);
    }

    private determineWorkoutType(
        protocol: TrainingProtocol,
        dayOfWeek: number,
        isRecoveryWeek: boolean
    ): 'endurance' | 'soglia' | 'vo2max' | 'recupero' | 'sprint' {
        if (isRecoveryWeek) return 'recupero';

        // Weekend = long endurance
        if (dayOfWeek === 0 || dayOfWeek === 6) return 'endurance';

        // Based on protocol focus
        if (protocol.id === 'build-threshold') return 'soglia';
        if (protocol.id === 'polarized' && dayOfWeek === 3) return 'vo2max';

        return 'endurance';
    }

    private determineWorkoutDuration(
        protocol: TrainingProtocol,
        workoutType: string,
        dayOfWeek: number
    ): number {
        if (workoutType === 'recupero') return 60;
        if (dayOfWeek === 0 || dayOfWeek === 6) return protocol.weeklyStructure.longRideDuration;
        return 90; // Default mid-week duration
    }

    private estimateTSS(duration: number, workoutType: string): number {
        const intensityFactors = {
            recupero: 0.4,
            endurance: 0.65,
            soglia: 0.95,
            vo2max: 1.1,
            sprint: 1.2
        };
        const if_value = intensityFactors[workoutType as keyof typeof intensityFactors] || 0.7;
        return Math.round((duration / 60) * if_value * 100);
    }

    private calculateEndDate(weeks: number): string {
        const end = new Date();
        end.setDate(end.getDate() + (weeks * 7));
        return end.toISOString().split('T')[0];
    }
}
