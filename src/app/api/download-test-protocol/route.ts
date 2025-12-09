import { NextRequest, NextResponse } from "next/server";
import { TEST_PROTOCOLS } from "@/lib/workouts/protocols";
import { generateZWO, generateERG } from "@/lib/workouts/formats";
import { cookies } from "next/headers";
import { getAthlete } from "@/lib/storage";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type'); // e.g., "CP20", "RAMP", etc.
    const format = searchParams.get('format') || 'zwo';

    if (!type) {
        return new NextResponse('Missing type parameter', { status: 400 });
    }

    // Get athlete's FTP from session
    const cookieStore = await cookies();
    const athleteId = cookieStore.get('athlete_session')?.value;
    let ftp = 250; // default

    if (athleteId) {
        const athlete = await getAthlete(athleteId);
        if (athlete?.ftp) {
            ftp = athlete.ftp;
        }
    }

    // Find the test protocol
    const protocolId = `test-${type.toLowerCase()}`;
    const protocol = TEST_PROTOCOLS[protocolId as keyof typeof TEST_PROTOCOLS];

    if (!protocol) {
        return new NextResponse('Test protocol not found', { status: 404 });
    }

    let content = '';
    let filename = `${protocol.name.replace(/[^a-z0-9]/gi, '_')}`;
    let contentType = 'text/plain';

    switch (format.toLowerCase()) {
        case 'zwo':
            content = generateZWO(protocol, ftp);
            filename += '.zwo';
            contentType = 'application/xml';
            break;
        case 'erg':
            content = generateERG(protocol, ftp);
            filename += '.erg';
            break;
        default:
            return new NextResponse('Unsupported format', { status: 400 });
    }

    return new NextResponse(content, {
        headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`
        }
    });
}
