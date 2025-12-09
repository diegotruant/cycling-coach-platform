import { NextResponse } from "next/server";
import { getAthlete, saveAthleteReport, AthleteReport } from "@/lib/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const { athleteId } = await req.json();

        if (!athleteId) {
            return NextResponse.json({ error: "Athlete ID required" }, { status: 400 });
        }

        const athlete = await getAthlete(athleteId);
        if (!athlete) {
            return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            Sei un coach di ciclismo esperto. Analizza i dati del seguente atleta e genera un report dettagliato sulle prestazioni.
            
            Nome: ${athlete.name}
            Età: ${athlete.dob ? new Date().getFullYear() - new Date(athlete.dob).getFullYear() : "N/D"}
            Peso: ${athlete.weight || "N/D"} kg
            FTP: ${athlete.ftp || "N/D"} W
            Max HR: ${athlete.maxHR || "N/D"} bpm
            Profilo Ciclista: ${athlete.riderProfile || "N/D"}
            
            Genera un report che includa:
            1. Analisi dello stato attuale basata sui dati forniti.
            2. Punti di forza e debolezza (ipotizzati in base al profilo).
            3. Consigli per il prossimo mesociclo.
            4. Suggerimenti nutrizionali e di recupero.
            
            Il report deve essere motivante e professionale.
            Formatta la risposta in Markdown.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const reportId = crypto.randomUUID();
        const report: AthleteReport = {
            id: reportId,
            date: new Date().toISOString(),
            content: text,
            generatedBy: 'AI',
            athleteId: athleteId
        };

        await saveAthleteReport(athleteId, report);

        return NextResponse.json({ id: reportId, content: text });

    } catch (error: any) {
        console.error("Error generating report:", error);
        // Log more details if available
        if (error.response) {
            console.error("Gemini API Error Response:", await error.response.text());
        }
        return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 });
    }
}
