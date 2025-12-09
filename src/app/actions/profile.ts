'use server';

import { revalidatePath } from "next/cache";
import { updateAthlete } from "@/lib/storage";
import { calculateBMI, estimateVLAmax, calculateAPR, estimateSomatotype, determineRiderProfile } from "@/lib/physiology";

export async function updateAthleteProfile(athleteId: string, formData: FormData) {
    const weight = parseFloat(formData.get('weight') as string);
    const height = parseFloat(formData.get('height') as string);
    const address = formData.get('address') as string;
    const dob = formData.get('dob') as string;

    const updates: any = {
        weight,
        height,
        address,
        dob,
    };

    // Calculate BMI if we have weight and height
    if (weight && height) {
        updates.bmi = calculateBMI(weight, height);
    }

    await updateAthlete(athleteId, updates);

    // Recalculate advanced metrics if we have the necessary data
    const athlete = await import('@/lib/storage').then(m => m.getAthlete(athleteId));
    if (athlete) {
        const advancedUpdates: any = {};

        if (athlete.p_max && athlete.cp) {
            advancedUpdates.vlamax = estimateVLAmax(athlete.p_max, athlete.cp);
        }

        if (athlete.p_max && athlete.ftp) {
            advancedUpdates.apr = calculateAPR(athlete.p_max, athlete.ftp);
        }

        if (updates.bmi) {
            advancedUpdates.somatotype = estimateSomatotype(
                updates.bmi,
                athlete.p_max,
                athlete.ftp
            );
        }

        if (athlete.p_max && athlete.ftp && athlete.w_prime) {
            advancedUpdates.riderProfile = determineRiderProfile(
                athlete.p_max,
                athlete.ftp,
                athlete.w_prime
            );
        }

        if (Object.keys(advancedUpdates).length > 0) {
            await updateAthlete(athleteId, advancedUpdates);
        }
    }

    revalidatePath('/athlete');
    return { success: true };
}
