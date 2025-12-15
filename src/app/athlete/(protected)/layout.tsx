import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkOnboardingStatus } from "@/app/actions/onboarding";
import { getCurrentAthlete } from "@/lib/auth-helpers";

import { currentUser } from "@clerk/nextjs/server";

export default async function ProtectedAthleteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await currentUser();
    if (!user) {
        redirect('/athlete/login');
    }

    const athlete = await getCurrentAthlete();

    if (!athlete) {
        redirect('/athlete/unauthorized');
    }
    const athleteId = athlete.id;

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
    }

    return (
        <div className="flex flex-col min-h-[50vh]">
            {children}
        </div>
    );
}
