'use server';

import { getAthletes } from "@/lib/storage";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAthleteAction(prevState: any, formData: FormData) {
    const id = formData.get('id') as string;
    const password = formData.get('password') as string;

    if (!id || !password) {
        return { error: 'Missing credentials' };
    }

    const athletes = await getAthletes();
    const athlete = athletes.find(a => a.id === id || a.email === id);

    if (!athlete || athlete.password !== password) {
        return { error: 'Invalid ID or Password' };
    }

    // Set session cookie
    (await cookies()).set('athlete_session', athlete.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    });

    redirect('/athlete');
}

export async function logoutAthleteAction() {
    (await cookies()).delete('athlete_session');
    redirect('/athlete/login');
}
