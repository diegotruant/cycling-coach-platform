import { NextRequest, NextResponse } from "next/server";
import { exchangeStravaToken } from "@/lib/integrations/strava";
import { getAthlete, updateAthlete } from "@/lib/storage";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/athlete/settings?error=strava_auth_failed', req.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/athlete/settings?error=missing_code', req.url));
    }

    try {
        const tokenData = await exchangeStravaToken(code);

        // Get current athlete session
        const cookieStore = await cookies();
        const athleteId = cookieStore.get('athlete_session')?.value;

        if (!athleteId) {
            return NextResponse.redirect(new URL('/athlete/login', req.url));
        }

        // Save token to athlete profile
        const athlete = await getAthlete(athleteId);
        if (athlete) {
            await updateAthlete(athleteId, {
                integrations: {
                    ...athlete.integrations,
                    strava: {
                        accessToken: tokenData.access_token,
                        refreshToken: tokenData.refresh_token,
                        expiresAt: tokenData.expires_at,
                        athleteId: tokenData.athlete.id
                    }
                }
            });
        }

        return NextResponse.redirect(new URL('/athlete/settings?success=strava_connected', req.url));

    } catch (e) {
        console.error('Strava Auth Error', e);
        return NextResponse.redirect(new URL('/athlete/settings?error=token_exchange_failed', req.url));
    }
}
