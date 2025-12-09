import { saveAthleteDiaryEntry } from "@/lib/storage";

const MOCK_MODE = !process.env.STRAVA_CLIENT_ID;

export const STRAVA_CONFIG = {
    clientId: process.env.STRAVA_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.STRAVA_CLIENT_SECRET || 'mock_secret',
    redirectUri: 'http://localhost:3000/api/integrations/strava/callback',
    authUrl: 'https://www.strava.com/oauth/authorize',
    tokenUrl: 'https://www.strava.com/oauth/token',
    apiUrl: 'https://www.strava.com/api/v3'
};

export interface StravaToken {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    athlete: {
        id: number;
        username: string;
        firstname: string;
        lastname: string;
    };
}

export function getStravaAuthUrl() {
    if (MOCK_MODE) {
        return `/api/integrations/strava/callback?code=mock_code&scope=read,activity:read_all`;
    }
    const params = new URLSearchParams({
        client_id: STRAVA_CONFIG.clientId,
        redirect_uri: STRAVA_CONFIG.redirectUri,
        response_type: 'code',
        approval_prompt: 'auto',
        scope: 'read,activity:read_all'
    });
    return `${STRAVA_CONFIG.authUrl}?${params.toString()}`;
}

export async function exchangeStravaToken(code: string): Promise<StravaToken> {
    if (MOCK_MODE) {
        return {
            access_token: 'mock_access_token_' + Date.now(),
            refresh_token: 'mock_refresh_token',
            expires_at: Math.floor(Date.now() / 1000) + 21600, // 6 hours
            athlete: {
                id: 123456,
                username: 'mock_cyclist',
                firstname: 'Mock',
                lastname: 'Cyclist'
            }
        };
    }

    const res = await fetch(STRAVA_CONFIG.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: STRAVA_CONFIG.clientId,
            client_secret: STRAVA_CONFIG.clientSecret,
            code,
            grant_type: 'authorization_code'
        })
    });

    if (!res.ok) {
        throw new Error('Failed to exchange Strava token');
    }

    return res.json();
}

export async function getStravaActivities(accessToken: string) {
    if (MOCK_MODE) {
        // Return some mock activities
        return [
            {
                id: 101,
                name: 'Morning Ride',
                distance: 45000,
                moving_time: 5400,
                total_elevation_gain: 300,
                type: 'Ride',
                start_date: new Date().toISOString(),
                average_watts: 180,
                weighted_average_watts: 200,
                kilojoules: 900,
                average_heartrate: 145,
                max_heartrate: 170,
                suffer_score: 55
            },
            {
                id: 102,
                name: 'Interval Session',
                distance: 30000,
                moving_time: 3600,
                total_elevation_gain: 100,
                type: 'Ride',
                start_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                average_watts: 210,
                weighted_average_watts: 230,
                kilojoules: 750,
                average_heartrate: 155,
                max_heartrate: 185,
                suffer_score: 80
            }
        ];
    }

    const res = await fetch(`${STRAVA_CONFIG.apiUrl}/athlete/activities?per_page=30`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!res.ok) {
        throw new Error('Failed to fetch Strava activities');
    }

    return res.json();
}
