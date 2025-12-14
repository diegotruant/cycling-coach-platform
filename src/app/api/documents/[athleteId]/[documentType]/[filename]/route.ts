import { NextRequest, NextResponse } from "next/server";
import { getAthlete } from "@/lib/storage";
import { downloadDocument, getDocumentSignedUrl } from "@/lib/supabase-storage";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ athleteId: string; documentType: string; filename: string }> }
) {
    const { athleteId, documentType, filename } = await params;

    // TODO: Add proper authorization check here.
    // Currently relies on unique paths and athleteId knowledge.

    try {
        const athlete = await getAthlete(athleteId);
        if (!athlete) {
            return new NextResponse("Athlete not found", { status: 404 });
        }

        const storagePath = `${athleteId}/${documentType}/${filename}`;
        console.log(`[API Debug] Attempting to download: ${storagePath} for athlete: ${athleteId}`);

        // Download file from Supabase Storage
        const fileBuffer = await downloadDocument(storagePath);

        if (!fileBuffer) {
            console.error(`[API Error] File not found in storage: ${storagePath}`);
            return new NextResponse(`File not found: ${storagePath}`, { status: 404 });
        }

        const ext = filename.toLowerCase().split('.').pop();
        let contentType = 'application/octet-stream';
        if (ext === 'pdf') contentType = 'application/pdf';
        if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        if (ext === 'png') contentType = 'image/png';

        return new NextResponse(fileBuffer as any, {
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
