import { NextResponse } from "next/server";
import { generateZWO, generateERG, generateMRC } from "@/lib/workouts/formats";
import { WorkoutDefinition } from "@/lib/workouts/protocols";

export async function GET() {
    const results: any = {};

    // 1. Mock Library Workout (Relative Power)
    const libWorkout: WorkoutDefinition = {
        id: 'test-lib',
        name: "Library Test Workout",
        description: "Standard library format with relative power",
        steps: [
            { type: "WARMUP", duration: 600, power: 0.5, text: "Warmup" },
            { type: "ACTIVE", duration: 300, power: { start: 0.5, end: 0.75 }, text: "Ramp" }, // Ramp
            { type: "ACTIVE", duration: 300, power: 0.9, text: "Steady" }
        ]
    };

    // 2. Mock AI Workout (Absolute Watts)
    const aiWorkout: WorkoutDefinition = {
        id: 'test-ai',
        name: "AI Test Workout",
        description: "AI format with absolute watts",
        steps: [
            { type: "WARMUP", duration: 600, power: { min: 100, max: 120, target: 110 } as any, text: "Warmup" },
            { type: "ACTIVE", duration: 300, power: { min: 200, max: 220, target: 210 } as any, text: "Interval" }
        ]
    };

    const ftp = 250;

    try {
        results.library = {
            zwo: generateZWO(libWorkout, ftp).substring(0, 50) + "...",
            erg: generateERG(libWorkout, ftp).substring(0, 50) + "...",
            mrc: generateMRC(libWorkout, ftp).substring(0, 50) + "...",
            status: "OK"
        };
    } catch (e) {
        results.library = { status: "ERROR", error: String(e) };
    }

    try {
        results.ai = {
            zwo: generateZWO(aiWorkout, ftp).substring(0, 50) + "...",
            erg: generateERG(aiWorkout, ftp).substring(0, 50) + "...",
            mrc: generateMRC(aiWorkout, ftp).substring(0, 50) + "...",
            status: "OK"
        };
    } catch (e) {
        results.ai = { status: "ERROR", error: String(e) };
    }

    return NextResponse.json(results);
}
