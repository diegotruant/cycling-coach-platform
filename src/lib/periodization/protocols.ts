import { TrainingProtocol } from './types';

// Evidence-based training protocols

export const ENDURANCE_BASE: TrainingProtocol = {
    id: 'endurance-base',
    name: 'Endurance Base Building',
    description: 'Costruzione base aerobica secondo metodologia Seiler Zone 2',

    suitability: {
        minTSB: 0,
        maxTSB: 100,
        requiredHRVStatus: ['green', 'yellow'],
        minReadiness: 60,
        experienceLevel: ['principiante', 'intermedio', 'avanzato']
    },

    duration: {
        minWeeks: 2,
        maxWeeks: 4,
        typical: 3
    },

    distribution: {
        zone1: 10,  // Recovery
        zone2: 80,  // Endurance (focus principale)
        zone3: 5,   // Tempo
        zone4: 5,   // Threshold
        zone5: 0,   // VO2 Max
        zone6: 0    // Anaerobic
    },

    weeklyStructure: {
        sessionsPerWeek: 4,
        longRideDuration: 180,
        intervalSessions: 0,
        recoveryDays: 3
    },

    tssProgression: {
        week1: 250,
        week2: 280,
        week3: 310,
        week4: 220  // Recovery week
    },

    adaptations: [
        'Aumento densità capillari muscolari',
        'Miglioramento efficienza mitocondriale',
        'Aumento capacità ossidativa dei grassi',
        'Sviluppo base aerobica solida',
        'Preparazione per lavoro ad alta intensità'
    ],

    references: [
        'Seiler, S. (2010). What is best practice for training intensity and duration distribution in endurance athletes?'
    ]
};

export const SWEET_SPOT: TrainingProtocol = {
    id: 'sweet-spot',
    name: 'Sweet Spot Training',
    description: 'Allenamento alla soglia efficiente (88-93% FTP) secondo Coggan',

    suitability: {
        minTSB: -5,
        maxTSB: 10,
        requiredHRVStatus: ['green'],
        minReadiness: 70,
        experienceLevel: ['intermedio', 'avanzato']
    },

    duration: {
        minWeeks: 3,
        maxWeeks: 4,
        typical: 3
    },

    distribution: {
        zone1: 5,
        zone2: 60,
        zone3: 30,  // Sweet Spot (88-93% FTP)
        zone4: 5,
        zone5: 0,
        zone6: 0
    },

    weeklyStructure: {
        sessionsPerWeek: 5,
        longRideDuration: 120,
        intervalSessions: 2,
        recoveryDays: 2
    },

    tssProgression: {
        week1: 280,
        week2: 320,
        week3: 350,
        week4: 240
    },

    adaptations: [
        'Miglioramento soglia del lattato',
        'Aumento efficienza alla soglia',
        'Preparazione per lavoro FTP',
        'Miglioramento economia di pedalata',
        'Aumento resistenza muscolare'
    ],

    references: [
        'Coggan, A. (2008). Training and Racing with a Power Meter'
    ]
};

export const POLARIZED: TrainingProtocol = {
    id: 'polarized',
    name: 'Polarized Training',
    description: 'Allenamento polarizzato 80/20 secondo Seiler',

    suitability: {
        minTSB: -10,
        maxTSB: 15,
        requiredHRVStatus: ['green', 'yellow'],
        minReadiness: 65,
        experienceLevel: ['intermedio', 'avanzato']
    },

    duration: {
        minWeeks: 4,
        maxWeeks: 6,
        typical: 5
    },

    distribution: {
        zone1: 5,
        zone2: 75,  // 80% low intensity
        zone3: 0,   // Evitare zona grigia
        zone4: 0,
        zone5: 20,  // 20% high intensity
        zone6: 0
    },

    weeklyStructure: {
        sessionsPerWeek: 5,
        longRideDuration: 180,
        intervalSessions: 1,
        recoveryDays: 2
    },

    tssProgression: {
        week1: 300,
        week2: 340,
        week3: 380,
        week4: 420
    },

    adaptations: [
        'Massimo sviluppo VO2 Max',
        'Mantenimento base aerobica eccellente',
        'Miglioramento potenza di picco',
        'Aumento capacità di recupero',
        'Preparazione gare endurance'
    ],

    references: [
        'Seiler, S., & Tønnessen, E. (2009). Intervals, thresholds, and long slow distance'
    ]
};

export const BUILD_THRESHOLD: TrainingProtocol = {
    id: 'build-threshold',
    name: 'Build Threshold',
    description: 'Costruzione soglia FTP con intervalli specifici',

    suitability: {
        minTSB: -5,
        maxTSB: 10,
        requiredHRVStatus: ['green'],
        minReadiness: 75,
        experienceLevel: ['intermedio', 'avanzato']
    },

    duration: {
        minWeeks: 3,
        maxWeeks: 4,
        typical: 3
    },

    distribution: {
        zone1: 5,
        zone2: 50,
        zone3: 10,
        zone4: 35,  // Focus soglia
        zone5: 0,
        zone6: 0
    },

    weeklyStructure: {
        sessionsPerWeek: 5,
        longRideDuration: 120,
        intervalSessions: 2,
        recoveryDays: 2
    },

    tssProgression: {
        week1: 290,
        week2: 330,
        week3: 360,
        week4: 250
    },

    adaptations: [
        'Aumento FTP',
        'Miglioramento potenza alla soglia',
        'Aumento tolleranza lattato',
        'Miglioramento efficienza neuromuscolare',
        'Preparazione gare criterium/cronometro'
    ]
};

export const RECOVERY_TAPER: TrainingProtocol = {
    id: 'recovery-taper',
    name: 'Recovery & Taper',
    description: 'Recupero attivo e scarico pre-gara',

    suitability: {
        minTSB: -100,
        maxTSB: 100,
        requiredHRVStatus: ['green', 'yellow', 'red', 'nfor'],
        minReadiness: 0,
        experienceLevel: ['principiante', 'intermedio', 'avanzato']
    },

    duration: {
        minWeeks: 1,
        maxWeeks: 2,
        typical: 1
    },

    distribution: {
        zone1: 30,
        zone2: 70,
        zone3: 0,
        zone4: 0,
        zone5: 0,
        zone6: 0
    },

    weeklyStructure: {
        sessionsPerWeek: 3,
        longRideDuration: 90,
        intervalSessions: 0,
        recoveryDays: 4
    },

    tssProgression: {
        week1: 150,
        week2: 100,
        week3: 80,
        week4: 60
    },

    adaptations: [
        'Recupero completo sistema nervoso',
        'Supercompensazione muscolare',
        'Riduzione fatica accumulata',
        'Preparazione forma di picco',
        'Prevenzione overtraining'
    ]
};

// Export all protocols
export const ALL_PROTOCOLS: TrainingProtocol[] = [
    ENDURANCE_BASE,
    SWEET_SPOT,
    POLARIZED,
    BUILD_THRESHOLD,
    RECOVERY_TAPER
];

// Helper to get protocol by ID
export function getProtocolById(id: string): TrainingProtocol | undefined {
    return ALL_PROTOCOLS.find(p => p.id === id);
}
