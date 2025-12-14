import { NextRequest, NextResponse } from "next/server";
import { getAthlete } from "@/lib/storage";
import { getDocumentSignedUrl } from "@/lib/supabase-storage";

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
        console.log(`[API Debug] Generating signed URL for: ${storagePath}`);

        // Generate signed URL instead of downloading
        const signedUrl = await getDocumentSignedUrl(storagePath);

        if (!signedUrl) {
            console.error(`[API Error] Failed to generate signed URL for: ${storagePath}`);
            return new NextResponse("File not found or access denied", { status: 404 });
        }

        // DEBUG: Return JSON to verify URL generation and Env Vars
        return NextResponse.json({
            status: 'ok',
            signedUrl,
            debug: {
                athleteId,
                documentType,
                filename,
                storagePath,
                envParams: {
                    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                    serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
                }
            }
        });

        // return NextResponse.redirect(signedUrl);

    } catch (error) {
        console.error("Error serving document:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
