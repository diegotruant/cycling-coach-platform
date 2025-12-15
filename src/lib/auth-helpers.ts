import { currentUser } from "@clerk/nextjs/server";
import { getAthleteByEmail, AthleteConfig } from "@/lib/storage";

export async function getCurrentAthlete(): Promise<AthleteConfig | null> {
    const user = await currentUser();
    if (!user) return null;

    // Use the primary email address to look up the athlete
    const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
    if (!email) return null;

    return getAthleteByEmail(email);
}

import { getCoachByEmail } from "@/lib/storage";

export async function getCurrentCoach() {
    const user = await currentUser();
    if (!user) return null;

    const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
    if (!email) return null;

    return getCoachByEmail(email);
}
