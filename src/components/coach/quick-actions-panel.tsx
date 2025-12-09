'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    MessageSquare,
    TestTube,
    Calendar,
    FileText,
    Users
} from "lucide-react";
import Link from "next/link";

const quickActions = [
    {
        icon: Plus,
        label: "Assegna Workout",
        description: "Assegna un allenamento",
        href: "/coach/athletes",
        color: "text-blue-600 bg-blue-50 hover:bg-blue-100"
    },
    {
        icon: TestTube,
        label: "Programma Test",
        description: "Schedula un test",
        href: "/coach/athletes",
        color: "text-green-600 bg-green-50 hover:bg-green-100"
    },
    {
        icon: Calendar,
        label: "Visualizza Calendario",
        description: "Vedi tutti gli allenamenti",
        href: "/coach/calendar",
        color: "text-purple-600 bg-purple-50 hover:bg-purple-100"
    },
    {
        icon: Users,
        label: "Gestisci Atleti",
        description: "Visualizza tutti gli atleti",
        href: "/coach/athletes",
        color: "text-orange-600 bg-orange-50 hover:bg-orange-100"
    },
    {
        icon: FileText,
        label: "Genera Report",
        description: "Crea report prestazioni",
        href: "/coach/reports",
        color: "text-pink-600 bg-pink-50 hover:bg-pink-100"
    },
    {
        icon: MessageSquare,
        label: "Invia Messaggio",
        description: "Comunica con gli atleti",
        href: "/coach/messages",
        color: "text-cyan-600 bg-cyan-50 hover:bg-cyan-100"
    }
];

export function QuickActionsPanel() {
    return (
        <Card className="rounded-xl border border-border bg-card shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Azioni Rapide</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {quickActions.map((action, index) => (
                        <Link
                            key={index}
                            href={action.href}
                            className="group"
                        >
                            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-background hover:bg-accent transition-all hover:shadow-md">
                                <div className={`p-3 rounded-full ${action.color} transition-transform group-hover:scale-110`}>
                                    <action.icon className="h-5 w-5" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium">{action.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 hidden md:block">
                                        {action.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
