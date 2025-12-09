import { NextResponse } from "next/server";
import { getAthlete, updateAthlete, createAthlete } from "@/lib/storage";
import { updateAthleteProfile, saveAndRecalculateCP } from "@/app/actions/athlete-profile";
import { assignWorkout } from "@/app/actions/workout-assignment";
import { generateZWO, generateERG, generateMRC } from "@/lib/workouts/formats";
import { WORKOUT_LIBRARY } from "@/lib/workouts/library";

export async function GET() {
    const logs: string[] = [];
    const log = (msg: string) => logs.push(`[${new Date().toISOString().split('T')[1].split('.')[0]}] ${msg}`);

    try {
        log("🚀 Starting Full Cycle Simulation...");

        // 1. Create/Reset Test Athlete
        const testId = "Test_Athlete_Simulation";
        log(`1. Creating/Resetting Athlete: ${testId}`);

        try {
            await createAthlete({
                id: testId,
                name: "Simulated Athlete",
                email: "simulated@test.com",
                onboardingCompleted: false,
                assignments: []
            });
            log("   - Athlete created.");
        } catch (e) {
            log("   - Athlete already exists or create failed, resetting via update.");
            await updateAthlete(testId, {
                name: "Simulated Athlete",
                email: "simulated@test.com",
                onboardingCompleted: false,
                assignments: []
            });
        }

        // 2. Onboarding
        log("2. Simulating Onboarding...");
        await updateAthlete(testId, {
            onboardingCompleted: true,
            documents: [
                { type: "QUESTIONNAIRE", status: "VERIFIED", uploadedAt: new Date().toISOString() },
                { type: "ANAMNESIS", status: "VERIFIED", uploadedAt: new Date().toISOString() },
                { type: "ETHICS", status: "VERIFIED", uploadedAt: new Date().toISOString() }
            ]
        });
        log("   - Onboarding completed. Documents verified.");

        // 3. Coach Updates Metrics (Auto-calc check)
        log("3. Coach Updates Physiological Metrics...");
        const formData = new FormData();
        formData.append("p_max", "1000");
        formData.append("cp", "300");
        formData.append("ftp", "250");
        formData.append("map", "350"); // Added MAP for APR
        formData.append("w_prime", "20000");
        formData.append("weight", "70");

        // We use the server action logic directly
        // Note: we can't call server action directly from API route easily due to FormData, 
        // but we can simulate the logic or import the logic if refactored.
        // We'll manually replicate the critical update logic to verify it works OR call the internal functions if possible.
        // Actually, we can just call updateAthlete with the values and verify the logic in `updateAthleteProfile` 
        // BUT `updateAthleteProfile` is the one doing the calculation.
        // Let's call `updateAthleteProfile`!

        // We need to mock FormData
        await updateAthleteProfile(testId, formData);

        const updatedAthlete = await getAthlete(testId);
        if (!updatedAthlete) throw new Error("Athlete not found after update");
        log(`   - Metrics updated: Pmax=${updatedAthlete.p_max}, CP=${updatedAthlete.cp}, FTP=${updatedAthlete.ftp}, MAP=${updatedAthlete.map}`);

        // Verify Auto-Calc
        const vlamax = updatedAthlete.vlamax;
        const apr = updatedAthlete.apr;
        const profile = updatedAthlete.riderProfile;

        log(`   - Auto-Calculated VLaMax: ${vlamax} (Expected ~0.7)`);
        log(`   - Auto-Calculated APR: ${apr} (Expected 1000-350=650)`);
        log(`   - Auto-Calculated Profile: ${profile}`);

        if (vlamax && vlamax > 0 && apr && apr > 0 && profile) {
            log("   ✅ Physiological Metrics Auto-calculation: SUCCESS");
        } else {
            log("   ❌ Physiological Metrics Auto-calculation: FAILED");
        }

        // 4. CP Model Recalculation
        log("4. Simulating CP Model Recalculation...");
        const cpFormData = new FormData();
        // Re-add base metrics
        cpFormData.append("p_max", "1000");
        cpFormData.append("cp", "300");
        cpFormData.append("ftp", "250");
        cpFormData.append("map", "350");
        cpFormData.append("w_prime", "20000");
        // Add best efforts
        cpFormData.append("best_3min", "400");
        cpFormData.append("best_5min", "350");
        cpFormData.append("best_12min", "280");

        await saveAndRecalculateCP(testId, cpFormData);
        const cpAthlete = await getAthlete(testId);
        if (!cpAthlete) throw new Error("Athlete not found after CP recalc");

        log(`   - Recalculated CP: ${cpAthlete.cp}`);
        log(`   - Recalculated W': ${cpAthlete.w_prime}`);

        if (cpAthlete.cp && cpAthlete.cp > 0 && cpAthlete.w_prime && cpAthlete.w_prime > 0) {
            log("   ✅ CP Model Recalculation: SUCCESS");
        } else {
            log("   ❌ CP Model Recalculation: FAILED");
        }

        // 5. Assign Workouts
        log("5. Assigning Workouts...");

        // 5a. Library Workout
        const libWorkoutId = "sst-2x20";
        await assignWorkout(testId, libWorkoutId, new Date().toISOString().split('T')[0], "Library Test");
        log(`   - Assigned Library Workout: ${libWorkoutId}`);

        // 5b. AI Workout (Simulated)
        const aiWorkoutStructure = {
            name: "AI VO2Max Simulation",
            description: "Simulated AI Workout",
            citations: ["Seiler 2013"],
            steps: [
                { type: "WARMUP", duration: 600, power: { min: 100, max: 150, target: 125 }, text: "Warmup" },
                { type: "ACTIVE", duration: 240, power: { min: 300, max: 320, target: 310 }, text: "Interval" }
            ]
        };
        await assignWorkout(testId, "ai-sim-1", new Date().toISOString().split('T')[0], "AI Test", aiWorkoutStructure);
        log(`   - Assigned AI Workout: ai-sim-1`);

        // 6. Verify Downloads
        log("6. Verifying Workout Downloads...");
        const finalAthlete = await getAthlete(testId);
        if (!finalAthlete) throw new Error("Athlete not found for final verification");

        const assignments = finalAthlete.assignments || [];

        for (const assignment of assignments) {
            log(`   Checking assignment: ${assignment.workoutName} (${assignment.id})`);

            let workout = assignment.workoutStructure;
            if (!workout && assignment.workoutId) {
                // Fallback logic check
                for (const category of Object.values(WORKOUT_LIBRARY)) {
                    const found = category.find(w => w.id === assignment.workoutId);
                    if (found) {
                        workout = found;
                        break;
                    }
                }
            }

            if (workout) {
                try {
                    const zwo = generateZWO(workout, finalAthlete.ftp || 250);
                    const erg = generateERG(workout, finalAthlete.ftp || 250);
                    const mrc = generateMRC(workout, finalAthlete.ftp || 250);

                    if (zwo.length > 0 && erg.length > 0 && mrc.length > 0) {
                        log(`      ✅ Formats Generated: ZWO (${zwo.length}b), ERG (${erg.length}b), MRC (${mrc.length}b)`);
                    } else {
                        log(`      ❌ Format Generation Failed`);
                    }
                } catch (e) {
                    log(`      ❌ Error generating formats: ${e}`);
                }
            } else {
                log(`      ❌ Workout structure not found`);
            }
        }

        log("🏁 Simulation Complete.");

        return NextResponse.json({ logs });
    } catch (error) {
        log(`❌ CRITICAL ERROR: ${error}`);
        return NextResponse.json({ logs, error: String(error) }, { status: 200 });
    }
}
