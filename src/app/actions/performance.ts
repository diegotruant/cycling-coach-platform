'use server';

import { updateAthlete, getAthlete } from "@/lib/storage";
import { generateMockPMCData, generateMockPowerCurve } from "@/lib/physiology/pmc";
import { revalidatePath } from "next/cache";

export async function generateMockDataAction(athleteId: string) {
    const athlete = await getAthlete(athleteId);
    if (!athlete) return;

    const ftp = athlete.ftp || 250;
    const mockAssignments = generateMockPMCData(athleteId, ftp);
    const mockPowerCurve = generateMockPowerCurve(ftp);

    // Keep future assignments
    const assignments = athlete.assignments || [];
    const existingFuture = assignments.filter(a => new Date(a.date) > new Date());

    // Merge mock history with future assignments and update power curve
    await updateAthlete(athleteId, {
        assignments: [...mockAssignments, ...existingFuture],
        metrics: {
            ...athlete.metrics,
            powerCurve: mockPowerCurve,
            updatedAt: new Date().toISOString()
        }
    });

    revalidatePath(`/coach/athletes/${athleteId}`);
}
