
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/api/auth/strava/callback';

export function getStravaAuthUrl() {
    const params = new URLSearchParams({
        client_id: STRAVA_CLIENT_ID || '',
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        approval_prompt: 'auto',
        scope: 'activity:read_all,profile:read_all',
    });
    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeToken(code: string) {
    const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to exchange token');
    }

    return response.json();
}

export async function getStravaActivities(accessToken: string) {
    const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch activities');
    }

    return response.json();
}
