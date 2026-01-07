import { createClient } from "@/lib/supabase/server";
import { getAthleteByEmail, AthleteConfig, getCoachByEmail } from "@/lib/storage";

export async function getCurrentAthlete(): Promise<AthleteConfig | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) return null;

    return getAthleteByEmail(user.email);
}

export async function getCurrentCoach() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) return null;

    return getCoachByEmail(user.email);
}
