// Base interface for all AI providers
export interface AIService {
    generateWorkout(params: WorkoutGenerationParams): Promise<GeneratedWorkout>;
    estimateCredits(params: WorkoutGenerationParams): number;
    testConnection(): Promise<boolean>;
}

export interface WorkoutGenerationParams {
    athleteProfile: {
        ftp: number;
        maxHR?: number;
        weight?: number;
        experience: 'principiante' | 'intermedio' | 'avanzato';
        goals?: string[];
    };
    workoutType: 'endurance' | 'soglia' | 'vo2max' | 'recupero' | 'sprint' | 'personalizzato';
    duration: number; // minutes
    targetTSS?: number;
    specificInstructions?: string;
}

export interface WorkoutInterval {
    type: 'riscaldamento' | 'lavoro' | 'recupero' | 'defaticamento';
    duration: number; // seconds
    power?: {
        min: number;
        max: number;
        target?: number;
    };
    heartRate?: {
        min?: number;
        max?: number;
        target?: number;
    };
    cadence?: {
        min?: number;
        max?: number;
        target?: number;
    };
    description: string;
}

export interface GeneratedWorkout {
    name: string;
    description: string;
    duration: number; // minutes
    tss: number;
    intervals: WorkoutInterval[];
    coachingNotes: string;
    difficulty: 'principiante' | 'intermedio' | 'avanzato';
}

export interface AIProviderConfig {
    provider: 'gemini' | 'openai' | 'claude';
    apiKey: string;
    model: string;
    maxTokens?: number;
}

export class AIServiceError extends Error {
    constructor(
        message: string,
        public code: 'API_KEY_INVALID' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'INVALID_RESPONSE' | 'UNKNOWN'
    ) {
        super(message);
        this.name = 'AIServiceError';
    }
}
