import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface GenerateWorkoutParams {
    ftp: number;
    durationMinutes: number;
    type: 'RECOVERY' | 'ENDURANCE' | 'TEMPO' | 'THRESHOLD' | 'VO2MAX' | 'ANAEROBIC';
    focus?: string; // e.g. "Climbing", "Sprinting"
    athleteProfile?: string; // Summary of athlete (e.g. "Sprinter", "Weak aerobic base")
}

export interface GeneratedWorkout {
    name: string;
    description: string;
    steps: {
        type: 'WARMUP' | 'ACTIVE' | 'REST' | 'COOLDOWN';
        duration: number; // seconds
        power: number; // % FTP (0.0 - 2.0)
        cadence?: number;
        text?: string;
    }[];
}

export async function generateWorkout(params: GenerateWorkoutParams): Promise<GeneratedWorkout> {
    if (!genAI) {
        console.warn("Gemini API Key missing. Returning mock workout.");
        return getMockWorkout(params);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Act as an elite cycling coach. Create a structured cycling workout based on the following parameters:
    - Athlete FTP: ${params.ftp}W
    - Duration: ${params.durationMinutes} minutes
    - Type: ${params.type}
    - Specific Focus: ${params.focus || 'General'}
    - Athlete Profile: ${params.athleteProfile || 'Balanced'}

    Return ONLY a JSON object with the following structure (no markdown, no extra text):
    {
        "name": "Creative Workout Name",
        "description": "Brief description of the workout goal and benefits.",
        "steps": [
            { "type": "WARMUP"|"ACTIVE"|"REST"|"COOLDOWN", "duration": seconds, "power": percent_of_ftp (e.g. 0.75 for 75%), "cadence": optional_rpm, "text": "Instruction for this step" }
        ]
    }
    Ensure the total duration matches ${params.durationMinutes} minutes closely.
    The workout should be scientifically sound and progressive.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("AI Generation Failed:", error);
        return getMockWorkout(params);
    }
}

function getMockWorkout(params: GenerateWorkoutParams): GeneratedWorkout {
    const mainDuration = (params.durationMinutes * 60) - 1200; // Total - 20min warmup/cool
    let mainPower = 0.7;

    switch (params.type) {
        case 'RECOVERY': mainPower = 0.5; break;
        case 'ENDURANCE': mainPower = 0.65; break;
        case 'TEMPO': mainPower = 0.8; break;
        case 'THRESHOLD': mainPower = 0.95; break;
        case 'VO2MAX': mainPower = 1.1; break;
        case 'ANAEROBIC': mainPower = 1.3; break;
    }

    return {
        name: `Mock ${params.type} Workout`,
        description: "This is a generated workout (Mock Mode - API Key missing).",
        steps: [
            { type: 'WARMUP', duration: 600, power: 0.5, text: "Warm up easy" },
            { type: 'ACTIVE', duration: Math.max(300, mainDuration), power: mainPower, text: `Main set: ${params.type}` },
            { type: 'COOLDOWN', duration: 600, power: 0.5, text: "Cool down" }
        ]
    };
}
