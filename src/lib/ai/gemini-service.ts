import {
    AIService,
    WorkoutGenerationParams,
    GeneratedWorkout,
    AIServiceError,
    WorkoutInterval
} from './types';

export class GeminiService implements AIService {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async generateWorkout(params: WorkoutGenerationParams): Promise<GeneratedWorkout> {
        try {
            const prompt = this.buildPrompt(params);
            const response = await this.callGeminiAPI(prompt);
            const workout = this.parseResponse(response);

            return workout;
        } catch (error) {
            if (error instanceof AIServiceError) {
                throw error;
            }
            throw new AIServiceError(
                `Errore nella generazione del workout: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
                'UNKNOWN'
            );
        }
    }

    estimateCredits(params: WorkoutGenerationParams): number {
        // Gemini Flash: 1 credito, Gemini Pro: 3 crediti
        return this.model.includes('pro') ? 3 : 1;
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.baseUrl}/models/${this.model}?key=${this.apiKey}`
            );
            return response.ok;
        } catch {
            return false;
        }
    }

    private buildPrompt(params: WorkoutGenerationParams): string {
        const { athleteProfile, workoutType, duration, targetTSS, specificInstructions } = params;

        return `Sei un coach di ciclismo esperto. Crea un workout strutturato per un atleta con le seguenti caratteristiche:

PROFILO ATLETA:
- FTP: ${athleteProfile.ftp}W
${athleteProfile.maxHR ? `- Frequenza Cardiaca Max: ${athleteProfile.maxHR} bpm` : ''}
${athleteProfile.weight ? `- Peso: ${athleteProfile.weight} kg` : ''}
- Livello: ${athleteProfile.experience}
${athleteProfile.goals ? `- Obiettivi: ${athleteProfile.goals.join(', ')}` : ''}

WORKOUT RICHIESTO:
- Tipo: ${workoutType}
- Durata: ${duration} minuti
${targetTSS ? `- TSS Target: ${targetTSS}` : ''}
${specificInstructions ? `- Note specifiche: ${specificInstructions}` : ''}

FORMATO OUTPUT (JSON valido):
{
  "name": "Nome workout descrittivo e motivante",
  "description": "Descrizione dettagliata degli obiettivi fisiologici e del 'perché' di questo allenamento.",
  "citations": ["Riferimento bibliografico 1 (es. Seiler et al., 2013)", "Riferimento 2"],
  "duration": ${duration},
  "tss": numero_tss_calcolato,
  "difficulty": "principiante|intermedio|avanzato",
  "intervals": [
    {
      "type": "riscaldamento|lavoro|recupero|defaticamento",
      "duration": durata_in_secondi,
      "power": {
        "min": potenza_minima_watt,
        "max": potenza_massima_watt,
        "target": potenza_target_watt
      },
      "cadence": {
        "target": cadenza_target_rpm
      },
      "description": "Descrizione dettagliata dell'intervallo"
    }
  ],
  "coachingNotes": "Note motivazionali e consigli tecnici per l'atleta"
}

REGOLE IMPORTANTI:
1. Rispetta sempre le zone di potenza basate su FTP:
   - Recupero: 45-55% FTP
   - Endurance: 56-75% FTP
   - Tempo: 76-90% FTP
   - Soglia: 91-105% FTP
   - VO2 Max: 106-120% FTP
   - Anaerobico: 121-150% FTP

2. SEMPRE includi:
   - Riscaldamento progressivo (10-15 min)
   - Defaticamento (10-15 min)
   - Intervalli di recupero adeguati tra gli sforzi
   - Riferimenti scientifici (evidence-based) che giustificano la struttura scelta (es. studi su HIIT, polarizzato, ecc.)

3. TSS deve essere realistico:
   - Recupero: 20-40 TSS
   - Endurance: 60-100 TSS
   - Soglia: 80-120 TSS
   - VO2 Max: 90-130 TSS

4. Durata totale degli intervalli deve sommare a ${duration * 60} secondi

5. Rispondi SOLO con il JSON, senza testo aggiuntivo prima o dopo.

Genera il workout:`;
    }

    private async callGeminiAPI(prompt: string): Promise<string> {
        try {
            const response = await fetch(
                `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 2048,
                        }
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Gemini API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData
                });

                if (response.status === 401) {
                    throw new AIServiceError('API key non valida', 'API_KEY_INVALID');
                }
                if (response.status === 429) {
                    throw new AIServiceError('Limite di richieste superato', 'RATE_LIMIT');
                }

                const errorMessage = errorData.error?.message || 'Errore nella chiamata API';
                throw new AIServiceError(errorMessage, 'NETWORK_ERROR');
            }

            const data = await response.json();

            if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
                console.error('Invalid API response:', data);
                throw new AIServiceError('Risposta API non valida', 'INVALID_RESPONSE');
            }

            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            if (error instanceof AIServiceError) {
                throw error;
            }
            console.error('Network error:', error);
            throw new AIServiceError(
                `Errore di rete: ${error instanceof Error ? error.message : 'Sconosciuto'}`,
                'NETWORK_ERROR'
            );
        }
    }

    private parseResponse(response: string): GeneratedWorkout {
        try {
            // Rimuovi eventuali markdown code blocks
            let jsonText = response.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\n?/g, '');
            }

            const workout = JSON.parse(jsonText);

            // Validazione base
            if (!workout.name || !workout.intervals || !Array.isArray(workout.intervals)) {
                throw new Error('Struttura workout non valida');
            }

            // Calcola TSS se non presente
            if (!workout.tss) {
                workout.tss = this.calculateTSS(workout.intervals, workout.duration);
            }

            return workout as GeneratedWorkout;
        } catch (error) {
            throw new AIServiceError(
                `Errore nel parsing della risposta: ${error instanceof Error ? error.message : 'Formato non valido'}`,
                'INVALID_RESPONSE'
            );
        }
    }

    private calculateTSS(intervals: WorkoutInterval[], duration: number): number {
        // Calcolo semplificato del TSS
        // TSS = (duration_hours * NP^4 * IF) / (FTP^4 * 3600) * 100
        // Per ora usiamo una stima basata sulla durata e intensità media
        const totalSeconds = intervals.reduce((sum, interval) => sum + interval.duration, 0);
        const avgIntensity = intervals.reduce((sum, interval) => {
            const power = interval.power?.target || interval.power?.min || 0;
            return sum + (power * interval.duration);
        }, 0) / totalSeconds;

        // Stima TSS basata su intensità relativa
        const intensityFactor = avgIntensity / 100; // Assumendo FTP = 100% come riferimento
        const durationHours = duration / 60;

        return Math.round(durationHours * intensityFactor * 100);
    }
}
