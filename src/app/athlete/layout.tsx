import { Inter } from "next/font/google";
import "@/app/globals.css";
import { cn } from "@/lib/utils";
import Link from 'next/link';

const inter = Inter({ subsets: ["latin"] });

export default function AthleteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-2xl items-center">
                    <div className="mr-4 hidden md:flex">
                        <Link className="mr-6 flex items-center space-x-2" href="/athlete">
                            <span className="hidden font-bold sm:inline-block">Dashboard</span>
                        </Link>
                        <Link className="mr-6 flex items-center space-x-2" href="/athlete/test-center">
                            <span className="hidden font-bold sm:inline-block">Test Center</span>
                        </Link>
                        <Link className="mr-6 flex items-center space-x-2" href="/athlete/calendar">
                            <span className="hidden font-bold sm:inline-block">Calendar</span>
                        </Link>
                        <Link className="mr-6 flex items-center space-x-2" href="/athlete/upload">
                            <span className="hidden font-bold sm:inline-block">Upload Activity</span>
                        </Link>
                        <Link className="mr-6 flex items-center space-x-2" href="/athlete/profile">
                            <span className="hidden font-bold sm:inline-block">Profile</span>
                        </Link>
                        <Link className="mr-6 flex items-center space-x-2" href="/athlete/recovery">
                            <span className="hidden font-bold sm:inline-block">Recovery</span>
                        </Link>
                        <Link className="mr-6 flex items-center space-x-2" href="/athlete/settings">
                            <span className="hidden font-bold sm:inline-block">Settings</span>
                        </Link>
                    </div>
                </div>
            </header>
            <main className="container py-6">
                {children}
            </main>
        </div>
    );
}
