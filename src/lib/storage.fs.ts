import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ATHLETES_DIR = path.join(DATA_DIR, 'Athletes');

export interface AthleteConfig {
    id: string;
    name: string;
    email: string;
    password?: string; // Auto-generated
    status?: 'ACTIVE' | 'ARCHIVED';

    // Personal Data
    dob?: string;
    weight?: number; // kg
    height?: number; // cm
    sex?: 'M' | 'F';
    category?: 'OPEN' | 'ELITE' | 'MASTER' | 'ELITE_MASTER';
    address?: string;

    // Physiological Metrics (Legacy & New)
    cp?: number; // Critical Power (W)
    w_prime?: number; // Anaerobic capacity (J)
    p_max?: number; // Peak power (W)
    ftp?: number; // Functional Threshold Power (W)
    map?: number; // Maximal Aerobic Power (W)
    vlamax?: number; // Maximal glycolytic rate (mmol/L/s)
    apr?: number; // Anaerobic Power Reserve (W)
    maxHR?: number; // Maximum Heart Rate (bpm)

    // Body Composition & Type
    bmi?: number;
    somatotype?: string; // e.g., "Mesomorph", "Ectomorph", etc.
    riderProfile?: 'SPRINTER' | 'CLIMBER' | 'ALL_ROUNDER' | 'TIME_TRIALIST'; // Cyclist specialization

    // Test Bests (for recalculation)
    best_3min?: number;
    best_5min?: number;
    best_12min?: number;
    peak_power_1s?: number;

    lastActivity?: string; // ISO Date

    // Onboarding & Documents
    onboardingCompleted?: boolean;
    documents?: {
        type: 'QUESTIONNAIRE' | 'ANAMNESIS' | 'ETHICS' | 'MEDICAL_CERTIFICATE';
        status: 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';
        url?: string;
        uploadedAt?: string;
        expirationDate?: string; // For medical certificate
    }[];

    // Workout Assignments
    assignments?: {
        id: string;
        date: string; // YYYY-MM-DD
        workoutId: string; // e.g., 'test-cp20'
        workoutName: string;
        workoutStructure?: any; // For AI generated or custom workouts
        status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
        notes?: string;
        assignedBy?: string; // Coach ID or 'AI'
        assignedAt: string;

        // Completed Activity Data
        activityData?: {
            duration: number; // seconds
            distance: number; // meters
            tss: number;
            if: number; // Intensity Factor
            np: number; // Normalized Power
            avgPower: number;
            avgHr?: number;
            calories?: number;
            elevationGain?: number;
        };
    }[];

    // Mesocycles (Training Plans)
    mesocycles?: {
        id: string;
        name: string;
        description: string;
        protocolId: string;
        protocolName: string;
        startDate: string;
        endDate: string;
        weeks: number;
        status: 'pending_approval' | 'approved' | 'active' | 'completed' | 'cancelled';
        approvedBy?: string;
        approvedAt?: string;
        coachNotes?: string;
        weeklyStructure: any[]; // Full mesocycle structure
        createdAt: string;
    }[];

    // Integrations
    integrations?: {
        strava?: {
            accessToken: string;
            refreshToken: string;
            expiresAt: number;
            athleteId: number;
        };
        intervals?: {
            apiKey: string;
            athleteId: string;
        };
        sram?: {
            accessToken: string;
            refreshToken: string;
        };
        hammerhead?: {
            accessToken: string;
            refreshToken: string;
        };
        oura?: {
            accessToken: string;
            refreshToken: string;
        };
        hrv4training?: {
            email: string; // Often uses Dropbox or email sync
            syncMethod: 'DROPBOX' | 'EMAIL';
        };
        elitehrv?: {
            accessToken: string;
            refreshToken: string;
        };
        kubios?: {
            accessToken: string;
            refreshToken: string;
        };
        [key: string]: any;
    };

    // Advanced Metrics
    metrics?: {
        cp?: number; // Critical Power (W)
        wPrime?: number; // W' (J)
        pMax?: number; // Max Power (W)
        lt1?: number; // Lactate Threshold 1 (W)
        updatedAt: string;

        // Power Duration Curve (MMP)
        powerCurve?: {
            duration: number; // seconds
            watts: number;
            date: string;
        }[];
    };
}

export interface AthleteDiaryEntry {
    date: string; // YYYY-MM-DD
    hrv?: number; // RMSSD
    hrr?: number;
    trafficLight?: 'GREEN' | 'YELLOW' | 'RED';
    notes?: string;

    // Detailed Metrics
    sdnn?: number;
    pnn50?: number;
    cv?: number;
    meanRR?: number;

    // Sleep & Recovery
    sleepQuality?: number; // 1-10
    sleepDuration?: number; // hours
    rpe?: number; // 1-10 (yesterday's training)
    soreness?: number; // 1-10
    fatigue?: number; // 1-10
    stress?: number; // 1-10
}

export interface AthleteTrends {
    baselineRMSSD?: {
        mean: number;
        stdDev: number;
        days: number;
    };
    // Other trends can be added here
}

export interface AthleteReport {
    id: string;
    date: string;
    content: string;
    generatedBy: 'AI' | 'COACH';
    athleteId: string;
}

export async function ensureDataDirs() {
    try {
        await fs.access(ATHLETES_DIR);
    } catch {
        await fs.mkdir(ATHLETES_DIR, { recursive: true });
    }
}

export async function getAthletes(includeArchived = false): Promise<AthleteConfig[]> {
    await ensureDataDirs();
    const entries = await fs.readdir(ATHLETES_DIR, { withFileTypes: true });
    const athletes: AthleteConfig[] = [];

    for (const entry of entries) {
        if (entry.isDirectory()) {
            try {
                const configPath = path.join(ATHLETES_DIR, entry.name, 'config.json');
                const data = await fs.readFile(configPath, 'utf-8');
                const athlete = JSON.parse(data);
                if (includeArchived || athlete.status !== 'ARCHIVED') {
                    athletes.push(athlete);
                }
            } catch (e) {
                console.error(`Failed to read athlete config for ${entry.name}`, e);
            }
        }
    }
    return athletes;
}

export async function createAthlete(athlete: AthleteConfig): Promise<void> {
    await ensureDataDirs();
    // Sanitize name for folder creation
    const folderName = `${athlete.name.replace(/[^a-z0-9]/gi, '_')}_${athlete.id}`;
    const athleteDir = path.join(ATHLETES_DIR, folderName);

    await fs.mkdir(athleteDir, { recursive: true });
    await fs.mkdir(path.join(athleteDir, 'activities'), { recursive: true });

    await fs.writeFile(
        path.join(athleteDir, 'config.json'),
        JSON.stringify(athlete, null, 2)
    );

    await fs.writeFile(
        path.join(athleteDir, 'diary.json'),
        JSON.stringify([], null, 2)
    );

    await fs.writeFile(
        path.join(athleteDir, 'trends.json'),
        JSON.stringify({}, null, 2)
    );

    await fs.writeFile(
        path.join(athleteDir, 'reports.json'),
        JSON.stringify([], null, 2)
    );
}

export async function getAthlete(id: string): Promise<AthleteConfig | null> {
    const athletes = await getAthletes(true);
    return athletes.find(a => a.id === id) || null;
}

export async function updateAthlete(id: string, updates: Partial<AthleteConfig>): Promise<void> {
    const athlete = await getAthlete(id);
    if (!athlete) throw new Error("Athlete not found");

    const updatedAthlete = { ...athlete, ...updates };

    // We need to find the directory again
    const folderName = `${athlete.name.replace(/[^a-z0-9]/gi, '_')}_${athlete.id}`;
    const configPath = path.join(ATHLETES_DIR, folderName, 'config.json');

    await fs.writeFile(configPath, JSON.stringify(updatedAthlete, null, 2));
}

export async function saveAthlete(athlete: AthleteConfig): Promise<void> {
    return updateAthlete(athlete.id, athlete);
}

// --- Diary & Trends Helpers ---

export async function getAthleteDir(id: string): Promise<string> {
    const athlete = await getAthlete(id);
    if (!athlete) throw new Error("Athlete not found");
    return path.join(ATHLETES_DIR, `${athlete.name.replace(/[^a-z0-9]/gi, '_')}_${athlete.id}`);
}

export async function getAthleteFolderPath(id: string): Promise<string> {
    return getAthleteDir(id);
}

export async function getAthleteDiary(id: string): Promise<AthleteDiaryEntry[]> {
    const dir = await getAthleteDir(id);
    const data = await fs.readFile(path.join(dir, 'diary.json'), 'utf-8');
    return JSON.parse(data);
}

export async function saveAthleteDiaryEntry(id: string, entry: AthleteDiaryEntry): Promise<void> {
    const dir = await getAthleteDir(id);
    const diaryPath = path.join(dir, 'diary.json');
    const diary: AthleteDiaryEntry[] = JSON.parse(await fs.readFile(diaryPath, 'utf-8'));

    // Check if entry for date exists, update or append
    const index = diary.findIndex(e => e.date === entry.date);
    if (index >= 0) {
        diary[index] = { ...diary[index], ...entry };
    } else {
        diary.unshift(entry); // Add to beginning
    }

    await fs.writeFile(diaryPath, JSON.stringify(diary, null, 2));
}

export async function getAthleteTrends(id: string): Promise<AthleteTrends> {
    const dir = await getAthleteDir(id);
    try {
        const data = await fs.readFile(path.join(dir, 'trends.json'), 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

export async function updateAthleteTrends(id: string, trends: Partial<AthleteTrends>): Promise<void> {
    const dir = await getAthleteDir(id);
    const trendsPath = path.join(dir, 'trends.json');
    const currentTrends = await getAthleteTrends(id);

    await fs.writeFile(trendsPath, JSON.stringify({ ...currentTrends, ...trends }, null, 2));
}

// --- Reports Management ---

export async function getAthleteReports(id: string): Promise<AthleteReport[]> {
    const dir = await getAthleteDir(id);
    try {
        const data = await fs.readFile(path.join(dir, 'reports.json'), 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export async function saveAthleteReport(id: string, report: AthleteReport): Promise<void> {
    const dir = await getAthleteDir(id);
    const reportsPath = path.join(dir, 'reports.json');

    let reports: AthleteReport[] = [];
    try {
        const data = await fs.readFile(reportsPath, 'utf-8');
        reports = JSON.parse(data);
    } catch {
        // File might not exist for older athletes
    }

    reports.unshift(report); // Add to beginning
    await fs.writeFile(reportsPath, JSON.stringify(reports, null, 2));
}

// --- Mesocycle Management ---

export async function saveMesocycle(athleteId: string, mesocycle: any): Promise<void> {
    const athlete = await getAthlete(athleteId);
    if (!athlete) throw new Error('Athlete not found');

    const mesocycles = athlete.mesocycles || [];

    // Check if mesocycle already exists (update) or add new
    const index = mesocycles.findIndex(m => m.id === mesocycle.id);
    if (index >= 0) {
        mesocycles[index] = {
            ...mesocycle,
            updatedAt: new Date().toISOString()
        };
    } else {
        mesocycles.push({
            ...mesocycle,
            createdAt: new Date().toISOString()
        });
    }

    await updateAthlete(athleteId, { mesocycles });
}

export async function getMesocycles(athleteId: string): Promise<any[]> {
    const athlete = await getAthlete(athleteId);
    return athlete?.mesocycles || [];
}

export async function getActiveMesocycle(athleteId: string): Promise<any | null> {
    const mesocycles = await getMesocycles(athleteId);
    return mesocycles.find(m => m.status === 'active') || null;
}

export async function assignWorkoutsFromMesocycle(athleteId: string, mesocycle: any, coachId: string): Promise<void> {
    const athlete = await getAthlete(athleteId);
    if (!athlete) throw new Error('Athlete not found');

    const assignments = athlete.assignments || [];
    const startDate = new Date(mesocycle.startDate);

    // Generate assignments from mesocycle structure
    mesocycle.weeklyStructure.forEach((week: any, weekIndex: number) => {
        week.workouts.forEach((workout: any) => {
            const workoutDate = new Date(startDate);
            workoutDate.setDate(workoutDate.getDate() + (weekIndex * 7) + workout.dayOfWeek);

            const assignment = {
                id: `${mesocycle.id}_w${week.week}_d${workout.dayOfWeek}`,
                date: workoutDate.toISOString().split('T')[0],
                workoutId: `mesocycle_${mesocycle.id}`,
                workoutName: workout.name,
                workoutStructure: workout,
                status: 'PENDING' as const,
                notes: workout.coachNotes || mesocycle.coachNotes,
                assignedBy: coachId,
                assignedAt: new Date().toISOString()
            };

            // Check if assignment already exists for this date
            const existingIndex = assignments.findIndex(a => a.date === assignment.date);
            if (existingIndex >= 0) {
                assignments[existingIndex] = assignment;
            } else {
                assignments.push(assignment);
            }
        });
    });

    await updateAthlete(athleteId, { assignments });
}

export async function getTodaysWorkout(athleteId: string): Promise<any | null> {
    const athlete = await getAthlete(athleteId);
    if (!athlete) return null;

    const today = new Date().toISOString().split('T')[0];
    const assignment = athlete.assignments?.find(a => a.date === today && a.status === 'PENDING');

    return assignment ? { ...assignment.workoutStructure, id: assignment.id } : null;
}

