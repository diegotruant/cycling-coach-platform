import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkOnboardingStatus } from "@/app/actions/onboarding";

export default async function ProtectedAthleteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const athleteId = cookieStore.get('athlete_session')?.value;

    if (!athleteId) {
        redirect('/login');
    }

    const status = await checkOnboardingStatus(athleteId);

    if (!status.completed) {
        redirect('/athlete/onboarding');
    }

    return (
        <>
            {children}
        </>
    );
}
