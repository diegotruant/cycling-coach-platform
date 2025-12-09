export type IntegrationType = 'OAUTH' | 'API_KEY' | 'MANUAL';

export interface IntegrationConfig {
    id: string;
    name: string;
    description: string;
    color: string;
    type: IntegrationType;
    iconText?: string; // Short text for icon if no SVG
}

export const INTEGRATIONS_CONFIG: Record<string, IntegrationConfig> = {
    strava: {
        id: 'strava',
        name: 'Strava',
        description: 'Sync activities automatically.',
        color: '#FC4C02',
        type: 'OAUTH',
        iconText: 'ST'
    },
    intervals: {
        id: 'intervals',
        name: 'Intervals.icu',
        description: 'Advanced cycling analytics.',
        color: '#000000',
        type: 'API_KEY',
        iconText: 'ICU'
    },
    sram: {
        id: 'sram',
        name: 'SRAMid',
        description: 'Sync gear usage and component data.',
        color: '#D41F30',
        type: 'OAUTH',
        iconText: 'AXS'
    },
    hammerhead: {
        id: 'hammerhead',
        name: 'Hammerhead',
        description: 'Sync routes and workouts to Karoo.',
        color: '#F9A825',
        type: 'OAUTH',
        iconText: 'HH'
    },
    oura: {
        id: 'oura',
        name: 'Oura Ring',
        description: 'Sleep and readiness tracking.',
        color: '#000000',
        type: 'OAUTH',
        iconText: 'O'
    },
    hrv4training: {
        id: 'hrv4training',
        name: 'HRV4Training',
        description: 'HRV measurements via camera or strap.',
        color: '#2E7D32',
        type: 'MANUAL',
        iconText: 'H4T'
    },
    elitehrv: {
        id: 'elitehrv',
        name: 'Elite HRV',
        description: 'Professional grade HRV analysis.',
        color: '#1565C0',
        type: 'OAUTH',
        iconText: 'E'
    },
    kubios: {
        id: 'kubios',
        name: 'Kubios',
        description: 'Scientific HRV analysis software.',
        color: '#4527A0',
        type: 'OAUTH',
        iconText: 'K'
    }
};

export function getAuthUrl(provider: string) {
    // Mock Auth URLs for now
    return `/api/integrations/${provider}/callback?code=mock_code`;
}
