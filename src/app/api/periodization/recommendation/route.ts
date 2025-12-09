import { NextRequest, NextResponse } from 'next/server';
import { MesocycleGenerator } from '@/lib/periodization/mesocycle-generator';
import { ALL_PROTOCOLS } from '@/lib/periodization/protocols';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const athleteId = searchParams.get('athleteId');

        if (!athleteId) {
            return NextResponse.json({ error: 'athleteId required' }, { status: 400 });
        }

        const generator = new MesocycleGenerator();
        // We need to expose the analyzer's recommendation logic.
        // Since MesocycleGenerator encapsulates it, we might need to duplicate logic or expose it.
        // Looking at MesocycleGenerator, it has an `analyzer` property but it's private.
        // However, `generateMesocycle` does step 1 (analyze) and step 2 (select protocol).
        // I can't easily call just that part without refactoring MesocycleGenerator.

        // Alternative: Instantiate AthleteAnalyzer directly here.
        const { AthleteAnalyzer } = await import('@/lib/periodization/athlete-analyzer');
        const analyzer = new AthleteAnalyzer();
        const analysis = await analyzer.analyzeAthlete(athleteId);
        const recommendation = analyzer.selectProtocol(analysis);

        return NextResponse.json({
            recommendedProtocolId: recommendation.protocol.id,
            rationale: recommendation.rationale,
            protocols: ALL_PROTOCOLS.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                typicalDuration: p.duration.typical,
                minWeeks: p.duration.minWeeks,
                maxWeeks: p.duration.maxWeeks
            }))
        });

    } catch (error) {
        console.error('Error getting recommendation:', error);
        return NextResponse.json({ error: 'Failed to get recommendation' }, { status: 500 });
    }
}
