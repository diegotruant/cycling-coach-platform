
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getAthlete } from "@/lib/storage";

const DATA_DIR = path.join(process.cwd(), 'data');
const ATHLETES_DIR = path.join(DATA_DIR, 'Athletes');

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ athleteId: string; filename: string }> }
) {
    const { athleteId, filename } = await params;

    // TODO: Add proper authorization check here. 
    // Currently relying on unique filenames and athleteId knowledge.
    // Ideally check session cookie to ensure only coach or the specific athlete can access.

    try {
        const athlete = await getAthlete(athleteId);
        if (!athlete) {
            return new NextResponse("Athlete not found", { status: 404 });
        }

        const folderName = `${athlete.name.replace(/[^a-z0-9]/gi, '_')}_${athlete.id}`;
        const filePath = path.join(ATHLETES_DIR, folderName, 'documents', filename);

        try {
            await fs.access(filePath);
        } catch {
            return new NextResponse("File not found", { status: 404 });
        }

        const fileBuffer = await fs.readFile(filePath);
        const ext = path.extname(filename).toLowerCase();

        let contentType = 'application/octet-stream';
        if (ext === '.pdf') contentType = 'application/pdf';
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error("Error serving document:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
