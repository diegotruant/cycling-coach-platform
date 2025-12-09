import { NextResponse } from "next/server";
import { getAthletes } from "@/lib/storage";

export async function GET() {
    try {
        const athletes = await getAthletes();
        // Return only necessary fields for the dropdown
        const simpleAthletes = athletes.map(a => ({
            id: a.id,
            name: a.name,
            email: a.email
        }));
        return NextResponse.json(simpleAthletes);
    } catch (error) {
        console.error("Error fetching athletes:", error);
        return NextResponse.json({ error: "Failed to fetch athletes" }, { status: 500 });
    }
}
