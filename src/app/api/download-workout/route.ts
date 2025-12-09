import { NextRequest, NextResponse } from "next/server";
import { getAthlete } from "@/lib/storage";
import { WORKOUT_LIBRARY } from "@/lib/workouts/library";
import { generateZWO, generateERG, generateMRC } from "@/lib/workouts/formats";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    // Accept both assignmentId and testId for backward compatibility
    const assignmentId = searchParams.get('assignmentId') || searchParams.get('testId');
    const ftp = parseInt(searchParams.get('ftp') || '250');
    const format = searchParams.get('format') || 'zwo';
    const athleteId = searchParams.get('athleteId');

    console.log(`Download request: assignmentId=${assignmentId}, athleteId=${athleteId}, format=${format}`);

    if (!assignmentId || !athleteId) {
        return new NextResponse('Missing assignmentId or athleteId', { status: 400 });
    }

    const athlete = await getAthlete(athleteId);
    if (!athlete) {
        console.error(`Athlete not found: ${athleteId}`);
        return new NextResponse('Athlete not found', { status: 404 });
    }

    console.log('Found athlete:', athlete.name);
    console.log('Looking for assignment:', assignmentId);
    console.log('Available assignments:', athlete.assignments?.map(a => a.id).join(', '));

    const assignment = athlete.assignments?.find(a => a.id === assignmentId);
    if (!assignment) {
        console.error(`Assignment not found: ${assignmentId}`);
        return new NextResponse('Assignment not found', { status: 404 });
    }

    let workout = assignment.workoutStructure;

    // Fallback if structure is missing (legacy)
    if (!workout && assignment.workoutId) {
        let lookupId = assignment.workoutId;

        // Map legacy mock IDs to real library IDs
        const mockMapping: Record<string, string> = {
            'mock-recovery-ride': 'rec-1',
            'mock-endurance-ride': 'end-1',
            'mock-sweet-spot': 'sst-2x20',
            'mock-tempo-intervals': 'tempo-3x15',
            'mock-vo2-max-intervals': 'vo2-5x5'
        };

        if (mockMapping[lookupId]) {
            lookupId = mockMapping[lookupId];
        }

        // Search in library
        for (const category of Object.values(WORKOUT_LIBRARY)) {
            const found = category.find(w => w.id === lookupId);
            if (found) {
                workout = found;
                break;
            }
        }
    }

    if (!workout) {
        console.error(`Workout structure not found for assignment: ${assignmentId}`);
        return new NextResponse('Workout structure not found', { status: 404 });
    }

    // Map 'intervals' to 'steps' for AI generated workouts
    if (!workout.steps && (workout as any).intervals) {
        workout = {
            ...workout,
            steps: (workout as any).intervals
        };
    }

    let content = '';
    // Sanitize filename: replace non-alphanumeric with underscore, remove duplicate underscores
    let safeName = (workout.name || 'workout').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    if (!safeName || safeName.length === 0) safeName = 'workout';
    let filename = safeName;
    let contentType = 'application/octet-stream';

    try {
        switch (format.toLowerCase()) {
            case 'zwo':
                content = generateZWO(workout, ftp);
                filename += '.zwo';
                contentType = 'application/xml';
                break;
            case 'erg':
                content = generateERG(workout, ftp);
                filename += '.erg';
                break;
            case 'mrc':
                content = generateMRC(workout, ftp);
                filename += '.mrc';
                break;
            default:
                return new NextResponse('Unsupported format', { status: 400 });
        }
    } catch (error) {
        console.error('Error generating workout format:', error);
        return new NextResponse('Error generating workout file', { status: 500 });
    }

    return new NextResponse(content, {
        headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`
        }
    });
}
