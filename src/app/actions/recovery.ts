'use server';

import { revalidatePath } from "next/cache";
import { getAthlete } from "@/lib/storage";
import {
    calculateBaseline,
    calculateTrafficLight,
    getTrafficLightRecommendation,
    analyzeOverreaching,
    validateMeasurement,
    type TrafficLightStatus
} from "@/lib/hrv-analysis";
import fs from 'fs/promises';
import path from 'path';

export interface RecoveryEntry {
    date: string; // YYYY-MM-DD
    hrv?: number; // RMSSD in ms
    hrr?: number; // Heart Rate Recovery
    rhr?: number; // Resting Heart Rate
    sleep_hours?: number;
    readiness?: number; // 1-10 scale
    notes?: string;
    trafficLight?: TrafficLightStatus;
    deviation?: number; // % from baseline
    recommendation?: string;
}

async function getAthleteDiaryPath(athleteId: string): Promise<string> {
    const athletesDir = path.join(process.cwd(), 'data', 'Athletes');
    const entries = await fs.readdir(athletesDir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory() && entry.name.endsWith(`_${athleteId}`)) {
            return path.join(athletesDir, entry.name, 'diary.json');
        }
    }

    throw new Error('Athlete directory not found');
}

export async function getRecoveryEntries(athleteId: string): Promise<RecoveryEntry[]> {
    try {
        const diaryPath = await getAthleteDiaryPath(athleteId);
        const data = await fs.readFile(diaryPath, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

export async function addRecoveryEntry(athleteId: string, formData: FormData) {
    const entry: RecoveryEntry = {
        date: formData.get('date') as string,
        hrv: formData.get('hrv') ? parseFloat(formData.get('hrv') as string) : undefined,
        hrr: formData.get('hrr') ? parseFloat(formData.get('hrr') as string) : undefined,
        rhr: formData.get('rhr') ? parseFloat(formData.get('rhr') as string) : undefined,
        sleep_hours: formData.get('sleep_hours') ? parseFloat(formData.get('sleep_hours') as string) : undefined,
        readiness: formData.get('readiness') ? parseInt(formData.get('readiness') as string) : undefined,
        notes: formData.get('notes') as string || undefined,
    };

    const diaryPath = await getAthleteDiaryPath(athleteId);
    const entries = await getRecoveryEntries(athleteId);

    // Calculate baseline from recent HRV values (last 7-30 days)
    if (entry.hrv) {
        const recentHRV = entries
            .filter(e => e.hrv && e.hrv > 0)
            .slice(0, 30)
            .map(e => e.hrv!);

        const baselineData = calculateBaseline(recentHRV, 7);

        // Calculate traffic light and recommendation
        const { status, deviation } = calculateTrafficLight(entry.hrv, baselineData.mean);

        // Count consecutive depressed days for context
        let consecutiveDays = 0;
        for (const e of entries) {
            if (e.hrv && baselineData.mean > 0) {
                const dev = ((e.hrv - baselineData.mean) / baselineData.mean) * 100;
                if (dev < -15) {
                    consecutiveDays++;
                } else {
                    break;
                }
            }
        }

        entry.trafficLight = status;
        entry.deviation = deviation;
        entry.recommendation = getTrafficLightRecommendation(status, deviation, consecutiveDays);
    }

    // Check if entry for this date already exists
    const existingIndex = entries.findIndex(e => e.date === entry.date);
    if (existingIndex >= 0) {
        entries[existingIndex] = entry;
    } else {
        entries.push(entry);
    }

    // Sort by date descending
    entries.sort((a, b) => b.date.localeCompare(a.date));

    await fs.writeFile(diaryPath, JSON.stringify(entries, null, 2));
    revalidatePath('/athlete/recovery');

    return { success: true };
}
