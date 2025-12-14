import { cookies, headers } from "next/headers";
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

    // Get current path from headers (set by middleware)
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';

    console.log('Protected Layout Pathname Check:', { pathname, completed: status.completed });

    // If documents are missing/invalid, block access to everything except the documents page
    if (!status.completed) {
        if (!pathname.includes('/athlete/documents')) {
            redirect('/athlete/documents');
        }
    } else {
        // If completed, but user tries to go to onboarding (if usage exists), maybe redirect to dashboard?
        // Optional, but for now we just enforce the BLOCKING.
    }

    return (
        <div className="flex flex-col min-h-[50vh]">
            {children}
        </div>
    );
}
