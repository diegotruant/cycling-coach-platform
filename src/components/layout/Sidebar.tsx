"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Dumbbell,
    Calendar,
    Settings,
    LogOut
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

const navigation = [
    { name: "Panoramica", href: "/coach", icon: LayoutDashboard },
    { name: "Atleti", href: "/coach/athletes", icon: Users },
    { name: "Allenamenti", href: "/coach/workouts", icon: Dumbbell },
    { name: "Calendario", href: "/coach/schedule", icon: Calendar },
    { name: "Impostazioni", href: "/coach/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col border-r border-border bg-card">
            <div className="flex h-16 items-center border-b border-border px-6">
                <span className="text-lg font-bold tracking-tight text-foreground">
                    Cycling<span className="text-primary">Coach</span>
                </span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "mr-3 h-5 w-5 flex-shrink-0",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground"
                                    )}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="border-t border-border p-4">
                <LogoutButton className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive bg-transparent border-none shadow-none justify-start">
                    <LogOut className="mr-3 h-5 w-5 flex-shrink-0 group-hover:text-destructive" />
                    Esci
                </LogoutButton>
            </div>
        </div>
    );
}
