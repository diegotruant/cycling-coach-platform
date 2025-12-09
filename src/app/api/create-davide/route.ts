import { NextResponse } from "next/server";
import { createAthlete, updateAthlete, getAthlete } from "@/lib/storage";
import { updateAthleteProfile, saveAndRecalculateCP } from "@/app/actions/athlete-profile";

export async function GET() {
    try {
        const id = "davide_bonaciti";

        // 1. Prepare Data 
        const formData = new FormData();
        // Re-submit base data to ensure consistency
        formData.append("dob", "1974-09-23");
        formData.append("category", "MASTER"); // Explicitly testing MASTER update
        formData.append("height", "180");
        formData.append("weight", "72");
        formData.append("p_max", "885");
        formData.append("map", "350");

        // Best Efforts 
        formData.append("best_12min", "262");
        formData.append("best_3min", "314");

        // 3. Execute Calculation
        await saveAndRecalculateCP(id, formData);

        // 4. Verify Result
        const athlete = await getAthlete(id);

        return NextResponse.json({
            message: "Athlete updated with Category MASTER",
            category: athlete?.category,
            metrics: {
                cp: athlete?.cp,
                w_prime: athlete?.w_prime,
                p_max: athlete?.p_max,
                riderProfile: athlete?.riderProfile,
                vlamax: athlete?.vlamax,
                apr: athlete?.apr
            }
        });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
