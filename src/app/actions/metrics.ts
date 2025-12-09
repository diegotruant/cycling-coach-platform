'use server';

import { getAthlete, updateAthlete } from '@/lib/storage';
import { calculateCP_WPrime, PowerEffort } from '@/lib/physiology/metrics';
import { revalidatePath } from 'next/cache';

export async function recalculateMetricsAction(athleteId: string) {
    try {
        const athlete = await getAthlete(athleteId);
        if (!athlete) return { success: false, error: 'Athlete not found' };

        // Gather best efforts from athlete config
        // In a real scenario, we would scan all activities to find the best power curve.
        // Here we rely on manually entered "Bests" or previously extracted bests.
        const efforts: PowerEffort[] = [];
        if (athlete.best_3min) efforts.push({ duration: 180, power: athlete.best_3min });
        if (athlete.best_5min) efforts.push({ duration: 300, power: athlete.best_5min });
        if (athlete.best_12min) efforts.push({ duration: 720, power: athlete.best_12min });

        // If we have FTP but no 20min/60min best, we might infer one, but it's risky.
        // Let's stick to explicit bests.

        const metrics = calculateCP_WPrime(efforts);

        if (metrics) {
            await updateAthlete(athleteId, {
                metrics: {
                    ...athlete.metrics,
                    cp: metrics.cp,
                    wPrime: metrics.wPrime,
                    updatedAt: new Date().toISOString()
                }
            });
            revalidatePath(`/coach/athletes/${athleteId}`);
            return { success: true, metrics };
        }

        return { success: false, error: 'Not enough data (need at least 2 efforts between 3-20 mins)' };
    } catch (error) {
        console.error('Recalculate metrics error:', error);
        return { success: false, error: 'Failed to recalculate metrics' };
    }
}
