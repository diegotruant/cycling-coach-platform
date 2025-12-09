import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

// --- MySQL Configuration ---
// In a real app, these should be environment variables
const pool = mysql.createPool({
    host: 'localhost',
    user: 'coach',
    password: 'coachpassword',
    database: 'cycling_coach',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true, // Return numbers as numbers, not strings
    // Convert dates to strings or JS Date objects
    dateStrings: true
});

// --- Types (Keep existing interfaces) ---
export interface AthleteConfig {
    id: string;
    name: string;
    email: string;
    password?: string;
    status?: 'ACTIVE' | 'ARCHIVED';

    // Personal Data
    dob?: string;
    weight?: number;
    height?: number;
    sex?: 'M' | 'F';
    category?: 'OPEN' | 'ELITE' | 'MASTER' | 'ELITE_MASTER';
    address?: string;

    // Physiological Metrics
    cp?: number;
    w_prime?: number;
    p_max?: number;
    ftp?: number;
    map?: number;
    vlamax?: number;
    apr?: number;
    maxHR?: number;

    // Body Composition
    bmi?: number;
    somatotype?: string;
    riderProfile?: 'SPRINTER' | 'CLIMBER' | 'ALL_ROUNDER' | 'TIME_TRIALIST';

    // Test Bests
    best_3min?: number;
    best_5min?: number;
    best_12min?: number;
    peak_power_1s?: number;

    lastActivity?: string;

    // Onboarding & Documents
    onboardingCompleted?: boolean;
    documents?: {
        type: 'QUESTIONNAIRE' | 'ANAMNESIS' | 'ETHICS' | 'MEDICAL_CERTIFICATE';
        status: 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';
        url?: string;
        uploadedAt?: string;
        expirationDate?: string;
    }[];

    // Workouts
    assignments?: {
        id: string;
        date: string;
        workoutId: string;
        workoutName: string;
        workoutStructure?: any;
        status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
        notes?: string;
        assignedBy?: string;
        assignedAt: string;
        activityData?: {
            duration: number;
            distance: number;
            tss: number;
            if: number;
            np: number;
            avgPower: number;
            avgHr?: number;
            calories?: number;
            elevationGain?: number;
        };
    }[];

    // Mesocycles
    mesocycles?: {
        id: string;
        name: string;
        description?: string;
        protocolId?: string;
        protocolName?: string;
        startDate: string;
        endDate: string;
        weeks?: number;
        status: 'pending_approval' | 'approved' | 'active' | 'completed' | 'cancelled';
        approvedBy?: string;
        approvedAt?: string;
        coachNotes?: string;
        weeklyStructure: any[];
        createdAt: string;
    }[];

    // Integrations
    integrations?: {
        strava?: { accessToken: string; refreshToken: string; expiresAt: number; athleteId: number; };
        intervals?: { apiKey: string; athleteId: string; };
        [key: string]: any;
    };

    // Advanced Metrics
    metrics?: {
        cp?: number;
        wPrime?: number;
        pMax?: number;
        lt1?: number;
        updatedAt: string;
        powerCurve?: { duration: number; watts: number; date: string; }[];
    };
}

// ... other interfaces kept same ...
export interface AthleteDiaryEntry { date: string; hrv?: number; hrr?: number; trafficLight?: 'GREEN' | 'YELLOW' | 'RED'; notes?: string; sdnn?: number; pnn50?: number; cv?: number; meanRR?: number; sleepQuality?: number; sleepDuration?: number; rpe?: number; soreness?: number; fatigue?: number; stress?: number; }
export interface AthleteTrends { baselineRMSSD?: { mean: number; stdDev: number; days: number; }; }
export interface AthleteReport { id: string; date: string; content: string; generatedBy: 'AI' | 'COACH'; athleteId: string; }

// --- DATA DIRS (For file-based fallbacks) ---
const DATA_DIR = path.join(process.cwd(), 'data');
const ATHLETES_DIR = path.join(DATA_DIR, 'Athletes');

export async function ensureDataDirs() {
    try { await fs.access(ATHLETES_DIR); } catch { await fs.mkdir(ATHLETES_DIR, { recursive: true }); }
}

// --- CORE FUNCTIONS (MySQL Implementation) ---

// Helper to map DB row to object
function mapAthleteRow(row: any): AthleteConfig {
    const extraData = row.extra_data || {};
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        status: row.status,
        dob: row.dob,
        weight: row.weight,
        height: row.height,
        sex: row.sex,
        category: row.category,
        ftp: row.ftp,
        cp: row.cp,
        w_prime: row.w_prime,
        p_max: row.p_max,
        // Spread extra data
        ...extraData,
        // Ensure arrays exist
        assignments: [],
        mesocycles: []
    };
}

export async function getAthletes(includeArchived = false): Promise<AthleteConfig[]> {
    let sql = 'SELECT * FROM athletes';
    if (!includeArchived) {
        sql += " WHERE status != 'ARCHIVED'";
    }

    const [rows] = await pool.query(sql);
    const athletes = (rows as any[]).map(mapAthleteRow);

    // Note: getAthletes usually doesn't need full assignments/mesocycles for the list view to be performant.
    // However, if the app relies on them being present in the list, we might need to fetch them.
    // The current SchedulePage fetches ALL athletes then flats assignments. 
    // So we assume we DO need assignments. This is N+1 problem but fine for 11 athletes.

    for (const athlete of athletes) {
        athlete.assignments = await getAssignments(athlete.id);
        // We probably don't need mesocycles for the list view, but let's be consistent or lazy load.
        // For standard "getAthletes", let's skip deep fetch of mesocycles/assignments unless critical?
        // Checking usage: SchedulePage used `athlete.assignments`. So YES we need assignments.
    }

    return athletes;
}

async function getAssignments(athleteId: string) {
    const [rows] = await pool.query('SELECT * FROM assignments WHERE athlete_id = ? ORDER BY date ASC', [athleteId]);
    return (rows as any[]).map(row => ({
        id: row.id,
        date: row.date, // already string due to dateStrings: true
        workoutId: row.workout_id || '',
        workoutName: row.workout_name,
        workoutStructure: row.workout_structure,
        status: row.status,
        notes: row.notes,
        assignedBy: row.assigned_by,
        assignedAt: row.created_at,
        activityData: row.activity_data
    }));
}

async function getMesocyclesFromDB(athleteId: string) {
    const [rows] = await pool.query('SELECT * FROM mesocycles WHERE athlete_id = ? ORDER BY start_date DESC', [athleteId]);
    return (rows as any[]).map(row => ({
        id: row.id,
        name: row.name,
        startDate: row.row_start_date || row.start_date,
        endDate: row.end_date,
        status: row.status,
        weeklyStructure: row.structure,
        createdAt: row.created_at
    }));
}

export async function getAthlete(id: string): Promise<AthleteConfig | null> {
    const [rows] = await pool.query('SELECT * FROM athletes WHERE id = ?', [id]);
    const list = rows as any[];
    if (list.length === 0) return null;

    const athlete = mapAthleteRow(list[0]);
    athlete.assignments = await getAssignments(id);
    athlete.mesocycles = await getMesocyclesFromDB(id);

    return athlete;
}

export async function createAthlete(athlete: AthleteConfig): Promise<void> {
    // 1. Prepare extra data
    const extraData = { ...athlete };
    // Remove known columns
    delete (extraData as any).id; delete (extraData as any).name; delete (extraData as any).email;
    delete (extraData as any).status; delete (extraData as any).dob; delete (extraData as any).weight;
    delete (extraData as any).height; delete (extraData as any).sex; delete (extraData as any).category;
    delete (extraData as any).ftp; delete (extraData as any).cp; delete (extraData as any).w_prime;
    delete (extraData as any).p_max; delete (extraData as any).assignments; delete (extraData as any).mesocycles;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.execute(`
            INSERT INTO athletes (id, name, email, status, dob, weight, height, sex, category, ftp, cp, w_prime, p_max, extra_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            athlete.id, athlete.name, athlete.email, athlete.status || 'ACTIVE', athlete.dob, athlete.weight, athlete.height,
            athlete.sex, athlete.category, athlete.ftp, athlete.cp, athlete.w_prime, athlete.p_max, JSON.stringify(extraData)
        ]);

        // Create folders for hybrid data
        await ensureDataDirs();
        const folderName = `${athlete.name.replace(/[^a-z0-9]/gi, '_')}_${athlete.id}`;
        const athleteDir = path.join(ATHLETES_DIR, folderName);
        await fs.mkdir(athleteDir, { recursive: true });
        await fs.mkdir(path.join(athleteDir, 'activities'), { recursive: true });
        await fs.writeFile(path.join(athleteDir, 'diary.json'), '[]');
        await fs.writeFile(path.join(athleteDir, 'trends.json'), '{}');
        await fs.writeFile(path.join(athleteDir, 'reports.json'), '[]');

        await connection.commit();
    } catch (e) {
        await connection.rollback();
        throw e;
    } finally {
        connection.release();
    }
}

export async function updateAthlete(id: string, updates: Partial<AthleteConfig>): Promise<void> {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update Columns & Extra Data
        // To do this correctly, we need the CURRENT state to merge extra_data? 
        // Or we assume `updates` allows us to patch.
        // For simplicity: if valid columns are present, update them. 
        // For extra_data, we fetch, merge, and update.

        const [currentRows] = await connection.query('SELECT * FROM athletes WHERE id = ?', [id]);
        if ((currentRows as any[]).length === 0) throw new Error("Athlete NOT FOUND");
        const current = (currentRows as any[])[0];
        const currentExtra = current.extra_data || {};

        // Merge updates into extra data IF they are not columns
        const KNOWN_COLUMNS = ['id', 'name', 'email', 'status', 'dob', 'weight', 'height', 'sex', 'category', 'ftp', 'cp', 'w_prime', 'p_max', 'assignments', 'mesocycles'];

        let newExtra = { ...currentExtra };
        for (const [key, value] of Object.entries(updates)) {
            if (!KNOWN_COLUMNS.includes(key)) {
                newExtra[key] = value;
            }
        }

        // Build SQL for columns
        let sqlUpdates: string[] = [];
        let params: any[] = [];

        if (updates.name !== undefined) { sqlUpdates.push('name = ?'); params.push(updates.name); }
        if (updates.email !== undefined) { sqlUpdates.push('email = ?'); params.push(updates.email); }
        if (updates.status !== undefined) { sqlUpdates.push('status = ?'); params.push(updates.status); }
        if (updates.dob !== undefined) { sqlUpdates.push('dob = ?'); params.push(updates.dob); }
        if (updates.weight !== undefined) { sqlUpdates.push('weight = ?'); params.push(updates.weight); }
        if (updates.height !== undefined) { sqlUpdates.push('height = ?'); params.push(updates.height); }
        if (updates.sex !== undefined) { sqlUpdates.push('sex = ?'); params.push(updates.sex); }
        if (updates.category !== undefined) { sqlUpdates.push('category = ?'); params.push(updates.category); }
        if (updates.ftp !== undefined) { sqlUpdates.push('ftp = ?'); params.push(updates.ftp); }
        if (updates.cp !== undefined) { sqlUpdates.push('cp = ?'); params.push(updates.cp); }
        if (updates.w_prime !== undefined) { sqlUpdates.push('w_prime = ?'); params.push(updates.w_prime); }
        if (updates.p_max !== undefined) { sqlUpdates.push('p_max = ?'); params.push(updates.p_max); }

        // Always update extra_data
        sqlUpdates.push('extra_data = ?');
        params.push(JSON.stringify(newExtra));

        if (sqlUpdates.length > 0) {
            params.push(id);
            await connection.execute(`UPDATE athletes SET ${sqlUpdates.join(', ')} WHERE id = ?`, params);
        }

        // 2. Handle Assignments Sync
        if (updates.assignments) {
            // Get existing IDs
            const [existing] = await connection.query('SELECT id FROM assignments WHERE athlete_id = ?', [id]);
            const existingIds = (existing as any[]).map(r => r.id);
            const newIds = updates.assignments.map(a => a.id);

            // Delete removed
            const toDelete = existingIds.filter(eid => !newIds.includes(eid));
            if (toDelete.length > 0) {
                // Use IN clause safely
                await connection.query(`DELETE FROM assignments WHERE id IN (?)`, [toDelete]);
            }

            // Upsert all
            for (const a of updates.assignments) {
                await connection.execute(`
                    INSERT INTO assignments (id, athlete_id, date, workout_id, workout_name, status, notes, assigned_by, created_at, workout_structure, activity_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        date=VALUES(date), workout_name=VALUES(workout_name), status=VALUES(status), notes=VALUES(notes), 
                        workout_structure=VALUES(workout_structure), activity_data=VALUES(activity_data)
                 `, [
                    a.id, id, a.date, a.workoutId, a.workoutName, a.status, a.notes || null, a.assignedBy || null, a.assignedAt || new Date(),
                    JSON.stringify(a.workoutStructure || {}), JSON.stringify(a.activityData || {})
                ]);
            }
        }

        // 3. Handle Mesocycles Sync (Similar logic)
        if (updates.mesocycles) {
            const [existingM] = await connection.query('SELECT id FROM mesocycles WHERE athlete_id = ?', [id]);
            const existingMIds = (existingM as any[]).map(r => r.id);
            const newMIds = updates.mesocycles.map(m => m.id);

            const toDeleteM = existingMIds.filter(mid => !newMIds.includes(mid));
            if (toDeleteM.length > 0) {
                await connection.query(`DELETE FROM mesocycles WHERE id IN (?)`, [toDeleteM]);
            }

            for (const m of updates.mesocycles) {
                await connection.execute(`
                    INSERT INTO mesocycles (id, athlete_id, name, start_date, end_date, status, structure, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        name=VALUES(name), start_date=VALUES(start_date), end_date=VALUES(end_date), status=VALUES(status), structure=VALUES(structure)
                 `, [
                    m.id, id, m.name, m.startDate, m.endDate, m.status, JSON.stringify(m.weeklyStructure || {}), m.createdAt || new Date()
                ]);
            }
        }

        await connection.commit();
    } catch (e) {
        await connection.rollback();
        throw e;
    } finally {
        connection.release();
    }
}

export async function saveAthlete(athlete: AthleteConfig): Promise<void> {
    return updateAthlete(athlete.id, athlete);
}


// --- HYBRID: DIARY / TRENDS / REPORTS (Keep reading from FS) ---

export async function getAthleteDir(id: string): Promise<string> {
    const athlete = await getAthlete(id);
    if (!athlete) throw new Error("Athlete not found");
    // Reconstruct folder name from DB name
    const folderName = `${athlete.name.replace(/[^a-z0-9]/gi, '_')}_${athlete.id}`;
    return path.join(ATHLETES_DIR, folderName);
}
export async function getAthleteFolderPath(id: string) { return getAthleteDir(id); }

export async function getAthleteDiary(id: string): Promise<AthleteDiaryEntry[]> {
    const dir = await getAthleteDir(id);
    try {
        const data = await fs.readFile(path.join(dir, 'diary.json'), 'utf-8');
        return JSON.parse(data);
    } catch { return []; }
}

export async function saveAthleteDiaryEntry(id: string, entry: AthleteDiaryEntry): Promise<void> {
    const dir = await getAthleteDir(id);
    const diaryPath = path.join(dir, 'diary.json');
    let diary: AthleteDiaryEntry[] = [];
    try { diary = JSON.parse(await fs.readFile(diaryPath, 'utf-8')); } catch { }
    const index = diary.findIndex(e => e.date === entry.date);
    if (index >= 0) diary[index] = { ...diary[index], ...entry };
    else diary.unshift(entry);
    await fs.writeFile(diaryPath, JSON.stringify(diary, null, 2));
}

export async function getAthleteTrends(id: string): Promise<AthleteTrends> {
    const dir = await getAthleteDir(id);
    try { return JSON.parse(await fs.readFile(path.join(dir, 'trends.json'), 'utf-8')); } catch { return {}; }
}

export async function updateAthleteTrends(id: string, trends: Partial<AthleteTrends>): Promise<void> {
    const dir = await getAthleteDir(id);
    const trendsPath = path.join(dir, 'trends.json');
    const current = await getAthleteTrends(id);
    await fs.writeFile(trendsPath, JSON.stringify({ ...current, ...trends }, null, 2));
}

export async function getAthleteReports(id: string): Promise<AthleteReport[]> {
    const dir = await getAthleteDir(id);
    try { return JSON.parse(await fs.readFile(path.join(dir, 'reports.json'), 'utf-8')); } catch { return []; }
}

export async function saveAthleteReport(id: string, report: AthleteReport): Promise<void> {
    const dir = await getAthleteDir(id);
    const reportsPath = path.join(dir, 'reports.json');
    let reports: AthleteReport[] = [];
    try { reports = JSON.parse(await fs.readFile(reportsPath, 'utf-8')); } catch { }
    reports.unshift(report);
    await fs.writeFile(reportsPath, JSON.stringify(reports, null, 2));
}

// --- KEEP MESOCYCLE HELPERS for backward compatibility (calling updateAthlete) ---
export async function saveMesocycle(athleteId: string, mesocycle: any): Promise<void> {
    const athlete = await getAthlete(athleteId);
    if (!athlete) throw new Error('Athlete not found');
    const mesocycles = athlete.mesocycles || [];
    const index = mesocycles.findIndex(m => m.id === mesocycle.id);
    if (index >= 0) mesocycles[index] = { ...mesocycle, updatedAt: new Date().toISOString() };
    else mesocycles.push({ ...mesocycle, createdAt: new Date().toISOString() });
    await updateAthlete(athleteId, { mesocycles });
}
export async function getMesocycles(athleteId: string) { return getMesocyclesFromDB(athleteId); }
export async function getActiveMesocycle(athleteId: string) {
    const mesocycles = await getMesocycles(athleteId);
    return mesocycles.find(m => m.status === 'active') || null;
}
export async function assignWorkoutsFromMesocycle(athleteId: string, mesocycle: any, coachId: string): Promise<void> {
    // This logic needs to build the assignment list and call updateAthlete
    const athlete = await getAthlete(athleteId);
    if (!athlete) throw new Error('Athlete not found');
    const assignments = athlete.assignments || []; // Get current existing
    const startDate = new Date(mesocycle.startDate);

    // Append/Update new workouts
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
            const existingIndex = assignments.findIndex(a => a.date === assignment.date);
            if (existingIndex >= 0) assignments[existingIndex] = assignment;
            else assignments.push(assignment);
        });
    });
    // Save via main update function
    await updateAthlete(athleteId, { assignments });
}
export async function getTodaysWorkout(athleteId: string) {
    const assignments = await getAssignments(athleteId);
    const today = new Date().toISOString().split('T')[0];
    const assignment = assignments.find(a => a.date === today && a.status === 'PENDING');
    return assignment ? { ...assignment.workoutStructure, id: assignment.id } : null;
}
