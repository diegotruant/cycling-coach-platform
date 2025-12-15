import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentCoach } from "@/lib/auth-helpers";

export default async function CoachLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await currentUser();
    if (!user) {
        redirect('/coach/login');
    }

    const coach = await getCurrentCoach();
    if (!coach) {
        redirect('/coach/unauthorized');
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
