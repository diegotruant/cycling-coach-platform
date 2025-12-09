import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

// --- PostgreSQL Configuration ---
// --- PostgreSQL Configuration ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cycling_coach',
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
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
        assignedAt?: string;
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

export interface AthleteDiaryEntry { date: string; hrv?: number; hrr?: number; trafficLight?: 'GREEN' | 'YELLOW' | 'RED'; notes?: string; sdnn?: number; pnn50?: number; cv?: number; meanRR?: number; sleepQuality?: number; sleepDuration?: number; rpe?: number; soreness?: number; fatigue?: number; stress?: number; }
export interface AthleteTrends { baselineRMSSD?: { mean: number; stdDev: number; days: number; }; }
export interface AthleteReport { id: string; date: string; content: string; generatedBy: 'AI' | 'COACH'; athleteId: string; }

// --- DATA DIRS (Deprecated, mostly unused now apart from maybe temporary files) ---
const DATA_DIR = path.join(process.cwd(), 'data');
const ATHLETES_DIR = path.join(DATA_DIR, 'Athletes');

export async function ensureDataDirs() {
    try { await fs.access(ATHLETES_DIR); } catch { await fs.mkdir(ATHLETES_DIR, { recursive: true }); }
}

// --- CORE FUNCTIONS (PostgreSQL Implementation) ---

// Helper to map DB row to object
function mapAthleteRow(row: any): AthleteConfig {
    const extraData = row.extra_data || {};
    // Helper for date to string
    const d2s = (d: any) => d ? (d instanceof Date ? d.toISOString().split('T')[0] : d) : undefined;

    return {
        id: row.id,
        name: row.name,
        email: row.email,
        status: row.status,
        dob: d2s(row.dob),
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

    const { rows } = await pool.query(sql);
    const athletes = rows.map(mapAthleteRow);

    // Optimize: Could fetch all assignments in one query, but for now loop is fine for low traffic
    for (const athlete of athletes) {
        athlete.assignments = await getAssignments(athlete.id);
    }

    return athletes;
}

async function getAssignments(athleteId: string) {
    const { rows } = await pool.query('SELECT * FROM assignments WHERE athlete_id = $1 ORDER BY date ASC', [athleteId]);
    return rows.map(row => ({
        id: row.id,
        date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
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
    const { rows } = await pool.query('SELECT * FROM mesocycles WHERE athlete_id = $1 ORDER BY start_date DESC', [athleteId]);
    return rows.map(row => ({
        id: row.id,
        name: row.name,
        startDate: row.start_date instanceof Date ? row.start_date.toISOString().split('T')[0] : row.start_date,
        endDate: row.end_date instanceof Date ? row.end_date.toISOString().split('T')[0] : row.end_date,
        status: row.status,
        weeklyStructure: row.structure,
        createdAt: row.created_at
    }));
}

export async function getAthlete(id: string): Promise<AthleteConfig | null> {
    const { rows } = await pool.query('SELECT * FROM athletes WHERE id = $1', [id]);
    if (rows.length === 0) return null;

    const athlete = mapAthleteRow(rows[0]);
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

    await pool.query(`
        INSERT INTO athletes (id, name, email, status, dob, weight, height, sex, category, ftp, cp, w_prime, p_max, extra_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
        athlete.id, athlete.name, athlete.email, athlete.status || 'ACTIVE', athlete.dob, athlete.weight, athlete.height,
        athlete.sex, athlete.category, athlete.ftp, athlete.cp, athlete.w_prime, athlete.p_max, JSON.stringify(extraData)
    ]);
}

export async function updateAthlete(id: string, updates: Partial<AthleteConfig>): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Update Columns & Extra Data
        const { rows: currentRows } = await client.query('SELECT * FROM athletes WHERE id = $1', [id]);
        if (currentRows.length === 0) throw new Error("Athlete NOT FOUND");
        const current = currentRows[0];
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
        let paramIdx = 1;

        if (updates.name !== undefined) { sqlUpdates.push(`name = $${paramIdx++}`); params.push(updates.name); }
        if (updates.email !== undefined) { sqlUpdates.push(`email = $${paramIdx++}`); params.push(updates.email); }
        if (updates.status !== undefined) { sqlUpdates.push(`status = $${paramIdx++}`); params.push(updates.status); }
        if (updates.dob !== undefined) { sqlUpdates.push(`dob = $${paramIdx++}`); params.push(updates.dob); }
        if (updates.weight !== undefined) { sqlUpdates.push(`weight = $${paramIdx++}`); params.push(updates.weight); }
        if (updates.height !== undefined) { sqlUpdates.push(`height = $${paramIdx++}`); params.push(updates.height); }
        if (updates.sex !== undefined) { sqlUpdates.push(`sex = $${paramIdx++}`); params.push(updates.sex); }
        if (updates.category !== undefined) { sqlUpdates.push(`category = $${paramIdx++}`); params.push(updates.category); }
        if (updates.ftp !== undefined) { sqlUpdates.push(`ftp = $${paramIdx++}`); params.push(updates.ftp); }
        if (updates.cp !== undefined) { sqlUpdates.push(`cp = $${paramIdx++}`); params.push(updates.cp); }
        if (updates.w_prime !== undefined) { sqlUpdates.push(`w_prime = $${paramIdx++}`); params.push(updates.w_prime); }
        if (updates.p_max !== undefined) { sqlUpdates.push(`p_max = $${paramIdx++}`); params.push(updates.p_max); }

        // Always update extra_data
        sqlUpdates.push(`extra_data = $${paramIdx++}`);
        params.push(JSON.stringify(newExtra));

        if (sqlUpdates.length > 0) {
            params.push(id);
            await client.query(`UPDATE athletes SET ${sqlUpdates.join(', ')} WHERE id = $${paramIdx}`, params);
        }

        // 2. Handle Assignments Sync
        if (updates.assignments) {
            const { rows: existing } = await client.query('SELECT id FROM assignments WHERE athlete_id = $1', [id]);
            const existingIds = existing.map(r => r.id);
            const newIds = updates.assignments.map(a => a.id);

            const toDelete = existingIds.filter(eid => !newIds.includes(eid));
            if (toDelete.length > 0) {
                await client.query(`DELETE FROM assignments WHERE id = ANY($1)`, [toDelete]);
            }

            for (const a of updates.assignments) {
                await client.query(`
                    INSERT INTO assignments (id, athlete_id, date, workout_id, workout_name, status, notes, assigned_by, created_at, workout_structure, activity_data)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (id) DO UPDATE SET
                        date = EXCLUDED.date,
                        workout_name = EXCLUDED.workout_name,
                        status = EXCLUDED.status,
                        notes = EXCLUDED.notes,
                        workout_structure = EXCLUDED.workout_structure,
                        activity_data = EXCLUDED.activity_data
                 `, [
                    a.id, id, a.date, a.workoutId, a.workoutName, a.status, a.notes || null, a.assignedBy || null, a.assignedAt || new Date(),
                    JSON.stringify(a.workoutStructure || {}), JSON.stringify(a.activityData || {})
                ]);
            }
        }

        // 3. Handle Mesocycles Sync
        if (updates.mesocycles) {
            const { rows: existingM } = await client.query('SELECT id FROM mesocycles WHERE athlete_id = $1', [id]);
            const existingMIds = existingM.map(r => r.id);
            const newMIds = updates.mesocycles.map(m => m.id);

            const toDeleteM = existingMIds.filter(mid => !newMIds.includes(mid));
            if (toDeleteM.length > 0) {
                await client.query(`DELETE FROM mesocycles WHERE id = ANY($1)`, [toDeleteM]);
            }

            for (const m of updates.mesocycles) {
                await client.query(`
                    INSERT INTO mesocycles (id, athlete_id, name, start_date, end_date, status, structure, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        start_date = EXCLUDED.start_date,
                        end_date = EXCLUDED.end_date,
                        status = EXCLUDED.status,
                        structure = EXCLUDED.structure
                 `, [
                    m.id, id, m.name, m.startDate, m.endDate, m.status, JSON.stringify(m.weeklyStructure || {}), m.createdAt || new Date()
                ]);
            }
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function saveAthlete(athlete: AthleteConfig): Promise<void> {
    return updateAthlete(athlete.id, athlete);
}


// --- POSTGRES: DIARY / TRENDS / REPORTS ---

export async function getAthleteDir(id: string): Promise<string> {
    // Deprecated: kept for compatibility if needed, but should warn
    return path.join(ATHLETES_DIR, `athlete_${id}`);
}
export async function getAthleteFolderPath(id: string) { return getAthleteDir(id); }

export async function getAthleteDiary(id: string): Promise<AthleteDiaryEntry[]> {
    const { rows } = await pool.query(`
        SELECT * FROM diary_entries 
        WHERE athlete_id = $1 
        ORDER BY date DESC
    `, [id]);

    return rows.map(row => ({
        date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
        hrv: row.hrv,
        hrr: row.hrr,
        trafficLight: row.traffic_light,
        notes: row.notes,
        sdnn: row.sdnn,
        pnn50: row.pnn50,
        cv: row.cv,
        meanRR: row.mean_rr,
        sleepQuality: row.sleep_quality,
        sleepDuration: row.sleep_duration,
        rpe: row.rpe,
        soreness: row.soreness,
        fatigue: row.fatigue,
        stress: row.stress
    }));
}

export async function saveAthleteDiaryEntry(id: string, entry: AthleteDiaryEntry): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query(`
            INSERT INTO diary_entries (id, athlete_id, date, hrv, hrr, traffic_light, notes, sdnn, pnn50, cv, mean_rr, sleep_quality, sleep_duration, rpe, soreness, fatigue, stress)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (athlete_id, date) DO UPDATE SET 
                hrv = EXCLUDED.hrv, 
                hrr = EXCLUDED.hrr,
                traffic_light = EXCLUDED.traffic_light,
                notes = EXCLUDED.notes,
                sdnn = EXCLUDED.sdnn,
                pnn50 = EXCLUDED.pnn50,
                cv = EXCLUDED.cv,
                mean_rr = EXCLUDED.mean_rr,
                sleep_quality = EXCLUDED.sleep_quality,
                sleep_duration = EXCLUDED.sleep_duration,
                rpe = EXCLUDED.rpe,
                soreness = EXCLUDED.soreness,
                fatigue = EXCLUDED.fatigue,
                stress = EXCLUDED.stress;
        `, [
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2), // Fallback uuid
            id, entry.date,
            entry.hrv || null, entry.hrr || null, entry.trafficLight || 'GREEN', entry.notes || null,
            entry.sdnn || null, entry.pnn50 || null, entry.cv || null, entry.meanRR || null,
            entry.sleepQuality || null, entry.sleepDuration || null, entry.rpe || null,
            entry.soreness || null, entry.fatigue || null, entry.stress || null
        ]);
    } finally {
        client.release();
    }
}

export async function getAthleteTrends(id: string): Promise<AthleteTrends> {
    // Calculate trends on the fly from the LAST 60 days of entries
    // This replaces reading the static 'trends.json' file
    const { rows } = await pool.query(`
        SELECT hrv 
        FROM diary_entries 
        WHERE athlete_id = $1 AND hrv IS NOT NULL
        ORDER BY date DESC 
        LIMIT 60
    `, [id]);

    if (rows.length === 0) return {};

    const values = rows.map(r => r.hrv);
    const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    const variance = values.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
        baselineRMSSD: {
            mean,
            stdDev,
            days: values.length
        }
    };
}

export async function updateAthleteTrends(id: string, trends: Partial<AthleteTrends>): Promise<void> {
    // No-op or update specific metadata if we had a table. 
    // Since we calculate trends dynamically now, specific updates to "baseline" might 
    // need to be stored in athlete.extra_data if they are manual overrides.
    // For now, we'll log it as legacy call.
    console.log('updateAthleteTrends is deprecated in SQL mode. Trends are calculated dynamically.');
}

export async function getAthleteReports(id: string): Promise<AthleteReport[]> {
    const { rows } = await pool.query(`
        SELECT * FROM reports 
        WHERE athlete_id = $1 
        ORDER BY date DESC
    `, [id]);

    return rows.map(row => ({
        id: row.id,
        athleteId: row.athlete_id,
        date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
        content: row.content,
        generatedBy: row.generated_by
    }));
}

export async function saveAthleteReport(id: string, report: AthleteReport): Promise<void> {
    await pool.query(`
        INSERT INTO reports (id, athlete_id, date, content, generated_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;
    `, [report.id, id, report.date, report.content, report.generatedBy]);
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
