'use server'

import { createAthlete as createAthleteInDb, getAthletes as getAthletesFromDb, AthleteConfig } from "@/lib/storage";
import { revalidatePath } from "next/cache";

export async function getAthletes() {
    return await getAthletesFromDb();
}

export async function createAthleteAction(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    if (!name || !email) {
        throw new Error("Name and email are required");
    }

    // Generate random password
    const password = Math.random().toString(36).slice(-8);
    const id = Math.random().toString(36).substring(7);

    const newAthlete: AthleteConfig = {
        id,
        name,
        email,
        password, // In a real app, this should be hashed
        category: 'OPEN',
        sex: 'M',
    };

    await createAthleteInDb(newAthlete);

    // Simulate sending email
    console.log(`
    ---------------------------------------------------
    [MOCK EMAIL SERVICE]
    To: ${email}
    Subject: Welcome to CyclingCoach!
    
    Hello ${name},
    
    Your coach has invited you to the platform.
    Here are your login credentials:
    
    ID: ${id}
    Password: ${password}
    
    Please log in and complete your profile.
    ---------------------------------------------------
  `);

    revalidatePath("/coach/athletes");
}
