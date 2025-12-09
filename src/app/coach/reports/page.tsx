"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

interface AthleteOption {
    id: string;
    name: string;
}

export default function ReportsPage() {
    const [athletes, setAthletes] = useState<AthleteOption[]>([]);
    const [selectedAthlete, setSelectedAthlete] = useState<string>("");
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState<string>("");
    const [reportContent, setReportContent] = useState<string>("");

    // Load athletes via API (client‑side)
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/coach/athletes");
                if (res.ok) {
                    const data: AthleteOption[] = await res.json();
                    setAthletes(data);
                } else {
                    console.error("Failed to load athletes");
                }
            } catch (e) {
                console.error("Error fetching athletes", e);
            }
        })();
    }, []);

    const handleGenerate = async () => {
        if (!selectedAthlete) {
            setMessage("Seleziona un atleta prima di generare il report.");
            return;
        }
        setGenerating(true);
        setMessage("");
        setReportContent("");
        try {
            const res = await fetch("/api/coach/reports/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ athleteId: selectedAthlete }),
            });
            if (res.ok) {
                const data = await res.json();
                setMessage(`✅ Report generato (ID: ${data.id})`);
                setReportContent(data.content);
            } else {
                const err = await res.json();
                setMessage(`⚠️ Errore: ${err.error || "Sconosciuto"}`);
            }
        } catch (e) {
            setMessage("⚠️ Impossibile contattare il server.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <main className="p-6 max-w-5xl mx-auto">
            <Card className="border border-border bg-card shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold">Report Prestazioni</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p className="text-muted-foreground">
                        Seleziona un atleta e genera il report delle sue performance.
                    </p>
                    <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Scegli un atleta…" />
                        </SelectTrigger>
                        <SelectContent>
                            {athletes.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                    {a.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="self-start bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white transition-all"
                    >
                        {generating ? "Generazione..." : "Genera Nuovo Report"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    {message && (
                        <p className={`mt-2 ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
                            {message}
                        </p>
                    )}

                    {reportContent && (
                        <div className="mt-6 p-4 border rounded-lg bg-muted/50 whitespace-pre-wrap font-mono text-sm">
                            {reportContent}
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
