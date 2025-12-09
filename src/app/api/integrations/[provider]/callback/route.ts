import { NextRequest, NextResponse } from 'next/server';
import { exchangeStravaToken } from '@/lib/integrations/strava';
import { cookies } from 'next/headers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider } = await params;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL(`/athlete/settings?error=${error}`, request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/athlete/settings?error=no_code', request.url));
    }

    try {
        if (provider === 'strava') {
            const tokenData = await exchangeStravaToken(code);

            // Get current athlete from session
            const cookieStore = await cookies();
            const athleteId = cookieStore.get('athlete_session')?.value;

            if (athleteId) {
                // Save token to athlete's profile
                const { updateAthlete, getAthlete } = await import('@/lib/storage');
                const athlete = await getAthlete(athleteId);

                if (athlete) {
                    const currentIntegrations = athlete.integrations || {};
                    await updateAthlete(athleteId, {
                        integrations: {
                            ...currentIntegrations,
                            strava: {
                                accessToken: tokenData.access_token,
                                refreshToken: tokenData.refresh_token,
                                expiresAt: tokenData.expires_at,
                                athleteId: tokenData.athlete.id
                            }
                        }
                    });
                }
            }

            return NextResponse.redirect(new URL('/athlete/settings?success=strava_connected', request.url));
        }

        // Handle other providers here...

        return NextResponse.redirect(new URL('/athlete/settings?error=unsupported_provider', request.url));
    } catch (err) {
        console.error('Integration error:', err);
        return NextResponse.redirect(new URL('/athlete/settings?error=exchange_failed', request.url));
    }
}
