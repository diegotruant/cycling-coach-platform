import { AIService, WorkoutGenerationParams, GeneratedWorkout } from './types';
import { GeminiService } from './gemini-service';

export class WorkoutGenerator {
    private aiService: AIService;

    constructor(apiKey: string, provider: 'gemini' = 'gemini', model?: string) {
        switch (provider) {
            case 'gemini':
                this.aiService = new GeminiService(apiKey, model || 'gemini-2.0-flash');
                break;
            default:
                throw new Error(`Provider ${provider} non supportato`);
        }
    }

    async generate(params: WorkoutGenerationParams): Promise<GeneratedWorkout> {
        return await this.aiService.generateWorkout(params);
    }

    estimateCredits(params: WorkoutGenerationParams): number {
        return this.aiService.estimateCredits(params);
    }

    async testConnection(): Promise<boolean> {
        return await this.aiService.testConnection();
    }
}

// Helper function to get workout generator from coach settings
export async function getWorkoutGenerator(): Promise<WorkoutGenerator | null> {
    // TODO: Get from coach settings in storage
    // For now, return null if no API key configured
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        return null;
    }

    return new WorkoutGenerator(apiKey, 'gemini');
}
