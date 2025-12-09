
export interface IntervalsActivity {
    id: string;
    start_date_local: string; // ISO string 2023-12-08T10:00:00
    name: string;
    type: string; // Ride, VirtualRide, Run, etc.
    moving_time: number; // seconds
    elapsed_time: number; // seconds
    icu_training_load: number; // TSS
    icu_intensity: number; // IF
    normalized_power: number;
    average_watts: number;
    average_heartrate: number;
    calories: number;
    total_elevation_gain: number;
    source: string; // "STRAVA", "GARMIN", etc.
}

export interface IntervalsProfile {
    id: string;
    name: string;
    // ... other fields
}

/**
 * Client for interacting with the Intervals.icu API
 * API Docs: https://intervals.icu/api/v1/docs/swagger-ui/index.html
 */
export class IntervalsClient {
    private apiKey: string;
    private athleteId: string;
    private baseUrl = 'https://intervals.icu/api/v1';

    constructor(apiKey: string, athleteId: string) {
        this.apiKey = apiKey;
        this.athleteId = athleteId;
    }

    private get headers() {
        return {
            'Authorization': `Basic ${btoa('API_KEY:' + this.apiKey)}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Fetch activities for a given date range
     */
    async getActivities(oldest: string, newest: string): Promise<IntervalsActivity[]> {
        // Endpoint: GET /athlete/{id}/activities?oldest=YYYY-MM-DD&newest=YYYY-MM-DD
        const url = `${this.baseUrl}/athlete/${this.athleteId}/activities?oldest=${oldest}&newest=${newest}`;

        try {
            const response = await fetch(url, { headers: this.headers });
            if (!response.ok) {
                if (response.status === 401) throw new Error('Intervals.icu API Key invalid');
                if (response.status === 404) throw new Error('Intervals.icu Athlete ID not found');
                throw new Error(`Intervals.icu API Error: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch from Intervals.icu', error);
            // Return empty array or rethrow depending on strategy. For now rethrow to alert caller.
            throw error;
        }
    }

    /**
     * Upload a planned workout to Intervals.icu calendar (Optional, if we want two-way sync)
     */
    async uploadWorkout(date: string, workout: any) {
        // Placeholder for future implementation
        // POST /athlete/{id}/events
    }
}
