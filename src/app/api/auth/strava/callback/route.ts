import { NextRequest, NextResponse } from 'next/server';
import { exchangeToken } from '@/lib/strava';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(new URL('/athlete/settings?error=no_code', request.url));
    }

    try {
        const data = await exchangeToken(code);

        // In a real app, we would save this to the athlete's profile in the database
        // For now, we'll set a cookie to simulate a logged-in state with Strava

        // Note: data.access_token, data.refresh_token, data.expires_at

        const response = NextResponse.redirect(new URL('/athlete/settings?success=true', request.url));

        response.cookies.set('strava_access_token', data.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: data.expires_in
        });

        return response;

    } catch (error) {
        console.error('Strava Auth Error:', error);
        return NextResponse.redirect(new URL('/athlete/settings?error=exchange_failed', request.url));
    }
}
