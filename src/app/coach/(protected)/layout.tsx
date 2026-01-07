import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

import { redirect } from "next/navigation";
import { getCurrentCoach } from "@/lib/auth-helpers";

export default async function CoachLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Auth check is handled by middleware, but we double check here for data availability
    const coach = await getCurrentCoach();
    if (!coach) {
        // If logged in but not a coach, redirect to unauthorized or login
        // Middleware should have caught unauthenticated users
        redirect('/login');
    }
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
