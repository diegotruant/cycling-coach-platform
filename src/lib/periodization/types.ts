// Types for athlete analysis and periodization

export interface AthleteAnalysis {
    athleteId: string;
    analysisDate: string;

    // HRV Data
    hrv: {
        current: number;
        baseline: number;
        status: 'green' | 'yellow' | 'red' | 'nfor';
        trend: 'improving' | 'stable' | 'declining';
        daysInStatus: number;
    };

    // Performance Management Chart
    pmc: {
        ctl: number; // Chronic Training Load (Fitness)
        atl: number; // Acute Training Load (Fatigue)
        tsb: number; // Training Stress Balance (Form)
        formStatus: 'fresh' | 'optimal' | 'fatigued' | 'very_fatigued';
    };

    // Readiness Score
    readiness: {
        score: number; // 0-100
        factors: {
            hrvContribution: number;
            tsbContribution: number;
            recentLoadContribution: number;
        };
    };

    // Recent Performance
    recent: {
        weeklyTSS: number[];
        avgTSSPerWeek: number;
        completionRate: number; // % workout completati
        powerCurveTrends: {
            duration: number;
            watts: number;
            trend: 'improving' | 'stable' | 'declining';
            changePercent: number;
        }[];
    };

    // Athlete Profile
    profile: {
        ftp: number;
        maxHR?: number;
        weight?: number;
        experience: 'principiante' | 'intermedio' | 'avanzato';
        goals: string[];
        availableHoursPerWeek: number;
        daysPerWeek: number;
    };

    // Constraints & Preferences
    constraints: {
        targetEvent?: {
            date: string;
            type: string;
            weeksUntil: number;
        };
        injuries?: string[];
        preferences?: string[];
    };
}

export interface TrainingProtocol {
    id: string;
    name: string;
    description: string;

    // When to use
    suitability: {
        minTSB: number;
        maxTSB: number;
        requiredHRVStatus: ('green' | 'yellow' | 'red' | 'nfor')[];
        minReadiness: number;
        experienceLevel: ('principiante' | 'intermedio' | 'avanzato')[];
    };

    // Structure
    duration: {
        minWeeks: number;
        maxWeeks: number;
        typical: number;
    };

    // Training zones distribution
    distribution: {
        zone1: number; // % Recovery
        zone2: number; // % Endurance
        zone3: number; // % Tempo
        zone4: number; // % Threshold
        zone5: number; // % VO2 Max
        zone6: number; // % Anaerobic
    };

    // Weekly structure
    weeklyStructure: {
        sessionsPerWeek: number;
        longRideDuration: number;
        intervalSessions: number;
        recoveryDays: number;
    };

    // TSS progression
    tssProgression: {
        week1: number;
        week2: number;
        week3: number;
        week4: number;
    };

    // Expected adaptations
    adaptations: string[];

    // Scientific references
    references?: string[];
}

export interface Mesocycle {
    id: string;
    athleteId: string;
    coachId: string;

    // Basic info
    name: string;
    description: string;

    // Timing
    startDate: string;
    endDate: string;
    weeks: number;

    // Protocol used
    protocol: {
        id: string;
        name: string;
        rationale: string; // Why this protocol was chosen
        expectedAdaptations: string[];
    };

    // Analysis that led to this choice
    analysis: AthleteAnalysis;

    // Weekly structure
    weeklyStructure: WeekStructure[];

    // Status
    status: 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    approvedBy?: string;
    approvedAt?: string;
    coachNotes?: string;

    // Monitoring
    actualProgress?: {
        completedWorkouts: number;
        totalWorkouts: number;
        avgCompletionRate: number;
        hrvTrend: 'improving' | 'stable' | 'declining';
    };
}

export interface WeekStructure {
    week: number;
    focus: string;
    targetTSS: number;
    workouts: MesocycleWorkout[];
}

export interface MesocycleWorkout {
    id?: string;
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    name: string;
    description: string;
    duration: number; // minutes
    tss: number;
    type: 'endurance' | 'soglia' | 'vo2max' | 'recupero' | 'sprint';
    intervals: {
        type: 'riscaldamento' | 'lavoro' | 'recupero' | 'defaticamento';
        duration: number; // seconds
        power: {
            min: number;
            max: number;
            target: number;
        };
        cadence?: {
            target: number;
        };
        description: string;
    }[];
    coachNotes?: string;
}

export interface ProtocolRecommendation {
    protocol: TrainingProtocol;
    score: number; // 0-100, how well it fits
    rationale: string;
    warnings?: string[];
    alternatives?: {
        protocol: TrainingProtocol;
        reason: string;
    }[];
}
