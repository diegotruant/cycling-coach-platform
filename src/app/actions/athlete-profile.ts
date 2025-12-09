'use server'

import { updateAthlete, getAthlete } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import { estimateVLAmax, calculateAPR, determineRiderProfile } from "@/lib/physiology";

export async function updateAthleteProfile(id: string, formData: FormData) {
    const updates: any = {};

    // Helper to parse numbers
    const num = (key: string) => {
        const val = formData.get(key);
        return val ? parseFloat(val as string) : undefined;
    };

    updates.category = formData.get("category") as string;
    updates.sex = formData.get("sex");
    updates.dob = formData.get("dob");

    updates.weight = num("weight");
    updates.height = num("height");

    updates.cp = num("cp");
    updates.w_prime = num("w_prime");
    updates.p_max = num("p_max");
    updates.ftp = num("ftp");
    updates.map = num("map");
    updates.maxHR = num("maxHR");
    updates.best_3min = num("best_3min");
    updates.best_5min = num("best_5min");
    updates.best_12min = num("best_12min");

    // Get manually entered values
    let vlamax = num("vlamax");
    let apr = num("apr");

    // Auto-calculate derived metrics if base metrics are available
    // We prioritize calculation to ensure consistency, as requested by the user
    if (updates.p_max && updates.cp) {
        vlamax = estimateVLAmax(updates.p_max, updates.cp);
    }

    if (updates.p_max && updates.map) {
        apr = calculateAPR(updates.p_max, updates.map);
    }

    updates.vlamax = vlamax;
    updates.apr = apr;

    // Determine Rider Profile
    // Determine Rider Profile
    // We can determine profile if we have at least Pmax and FTP. W' is optional but helpful.
    if (updates.p_max && updates.ftp) {
        updates.riderProfile = determineRiderProfile(
            updates.p_max,
            updates.ftp,
            updates.w_prime,
            updates.vlamax,
            updates.apr
        );
    }

    await updateAthlete(id, updates);
    revalidatePath(`/coach/athletes/${id}`);
}

export async function saveAndRecalculateCP(id: string, formData: FormData) {
    // First save all the data (including best efforts)
    await updateAthleteProfile(id, formData);

    const { calculateCP_WPrime } = await import('@/lib/physiology/metrics');

    const best3 = parseFloat(formData.get("best_3min") as string);
    const best5 = parseFloat(formData.get("best_5min") as string);
    const best12 = parseFloat(formData.get("best_12min") as string);

    const efforts = [];
    if (best3) efforts.push({ duration: 180, power: best3 });
    if (best5) efforts.push({ duration: 300, power: best5 });
    if (best12) efforts.push({ duration: 720, power: best12 });

    const metrics = calculateCP_WPrime(efforts);

    if (metrics) {
        const athlete = await getAthlete(id);
        if (athlete) {
            await updateAthlete(id, {
                cp: metrics.cp,
                w_prime: metrics.wPrime,
                metrics: {
                    ...athlete.metrics,
                    cp: metrics.cp,
                    wPrime: metrics.wPrime,
                    updatedAt: new Date().toISOString()
                }
            });
        }
    }

    revalidatePath(`/coach/athletes/${id}`);
}
