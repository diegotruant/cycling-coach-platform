/**
 * Full Flow Simulation Script v2
 * Tests the entire athlete lifecycle from creation to AI training plan
 */

import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const TEST_ATHLETE_ID = `test_${Date.now()}`;
const COACH_ID = 'coach_diego';

interface TestResult {
    step: string;
    success: boolean;
    message: string;
    data?: any;
}

const results: TestResult[] = [];

function log(step: string, success: boolean, message: string, data?: any) {
    const emoji = success ? '✅' : '❌';
    console.log(`${emoji} [${step}] ${message}`);
    if (data && !success) console.log('   Error Details:', data);
    results.push({ step, success, message, data });
}

async function step1_CreateAthlete(): Promise<boolean> {
    console.log('\n========== STEP 1: CREATE ATHLETE ==========\n');
    try {
        const result = await pool.query(`
            INSERT INTO athletes (id, name, email, status, dob, weight, height, sex, category, extra_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, [
            TEST_ATHLETE_ID,
            'Test Athlete Simulation',
            `test_${Date.now()}@example.com`,
            'ACTIVE',
            '1990-05-15',
            72,
            178,
            'M',
            'SENIOR',
            JSON.stringify({ password: '123456', documentsStatus: 'pending' })
        ]);

        // Verify athlete was created
        const { rows: check } = await pool.query('SELECT id FROM athletes WHERE id = $1', [TEST_ATHLETE_ID]);
        if (check.length === 0) {
            log('CREATE_ATHLETE', false, 'Athlete was not created (no rows returned)');
            return false;
        }

        log('CREATE_ATHLETE', true, `Athlete created with ID: ${TEST_ATHLETE_ID}`);
        return true;
    } catch (error: any) {
        log('CREATE_ATHLETE', false, `Failed: ${error.message}`, error.detail || error.hint);
        return false;
    }
}

async function step2_UpdatePhysiologicalData(): Promise<boolean> {
    console.log('\n========== STEP 2: UPDATE PHYSIOLOGICAL DATA ==========\n');
    try {
        await pool.query(`
            UPDATE athletes 
            SET ftp = $1, cp = $2, w_prime = $3, p_max = $4,
                extra_data = COALESCE(extra_data, '{}'::jsonb) || $5::jsonb
            WHERE id = $6
        `, [
            280, // FTP
            265, // CP
            22000, // W'
            1100, // Pmax
            JSON.stringify({
                vlmax: 0.42,
                apr: 1.18,
                riderProfile: 'All-Rounder',
                testData: {
                    lastTest: new Date().toISOString(),
                    testType: 'CP Test'
                }
            }),
            TEST_ATHLETE_ID
        ]);

        log('UPDATE_PHYSIO', true, 'Physiological data updated (FTP: 280W, CP: 265W)');
        return true;
    } catch (error: any) {
        log('UPDATE_PHYSIO', false, `Failed: ${error.message}`, error.detail);
        return false;
    }
}

async function step3_SimulateDocumentUpload(): Promise<boolean> {
    console.log('\n========== STEP 3: SIMULATE DOCUMENT UPLOAD ==========\n');
    try {
        await pool.query(`
            UPDATE athletes 
            SET extra_data = COALESCE(extra_data, '{}'::jsonb) || $1::jsonb
            WHERE id = $2
        `, [
            JSON.stringify({
                documentsStatus: 'verified',
                documents: {
                    medicalCertificate: {
                        uploaded: true,
                        uploadedAt: new Date().toISOString(),
                        filename: 'certificato_medico.pdf'
                    },
                    privacyConsent: {
                        uploaded: true,
                        uploadedAt: new Date().toISOString(),
                        filename: 'privacy_consent.pdf'
                    }
                }
            }),
            TEST_ATHLETE_ID
        ]);

        log('DOCUMENT_UPLOAD', true, 'Documents marked as uploaded and verified');
        return true;
    } catch (error: any) {
        log('DOCUMENT_UPLOAD', false, `Failed: ${error.message}`, error.detail);
        return false;
    }
}

async function step4_AddHRVData(): Promise<boolean> {
    console.log('\n========== STEP 4: ADD HRV/DIARY DATA ==========\n');
    try {
        const today = new Date();
        let entriesAdded = 0;

        // Add 7 days of HRV data
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const hrv = 55 + Math.floor(Math.random() * 20); // 55-75
            const trafficLight = hrv > 65 ? 'GREEN' : hrv > 55 ? 'YELLOW' : 'RED';
            const entryId = `diary_${TEST_ATHLETE_ID}_${dateStr}`;

            await pool.query(`
                INSERT INTO diary_entries (id, athlete_id, date, hrv, traffic_light, notes, sleep_quality, rpe)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (athlete_id, date) DO UPDATE SET
                    hrv = EXCLUDED.hrv,
                    traffic_light = EXCLUDED.traffic_light
            `, [
                entryId,
                TEST_ATHLETE_ID,
                dateStr,
                hrv,
                trafficLight,
                `Simulated entry for ${dateStr}`,
                Math.floor(Math.random() * 3) + 3, // 3-5
                Math.floor(Math.random() * 4) + 4  // 4-7
            ]);

            entriesAdded++;
        }

        log('ADD_HRV', true, `Added ${entriesAdded} HRV diary entries`);
        return true;
    } catch (error: any) {
        log('ADD_HRV', false, `Failed: ${error.message}`, error.detail);
        return false;
    }
}

async function step5_CreateMesocycle(): Promise<string | null> {
    console.log('\n========== STEP 5: CREATE MESOCYCLE (AI SIMULATION) ==========\n');
    try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 28); // 4 weeks

        const mesocycleId = `meso_${Date.now()}`;

        const weeklyStructure = [
            {
                week: 1,
                focus: 'Base Building',
                workouts: [
                    { dayOfWeek: 1, name: 'Endurance Ride', type: 'ENDURANCE', duration: 90 },
                    { dayOfWeek: 3, name: 'Tempo Intervals', type: 'TEMPO', duration: 75 },
                    { dayOfWeek: 5, name: 'Recovery Spin', type: 'RECOVERY', duration: 45 },
                    { dayOfWeek: 6, name: 'Long Ride', type: 'ENDURANCE', duration: 150 }
                ]
            },
            {
                week: 2,
                focus: 'Build Phase',
                workouts: [
                    { dayOfWeek: 1, name: 'Sweet Spot', type: 'SWEETSPOT', duration: 90 },
                    { dayOfWeek: 3, name: 'VO2max Intervals', type: 'VO2MAX', duration: 60 },
                    { dayOfWeek: 5, name: 'Active Recovery', type: 'RECOVERY', duration: 40 },
                    { dayOfWeek: 6, name: 'Endurance Ride', type: 'ENDURANCE', duration: 120 }
                ]
            },
            {
                week: 3,
                focus: 'Intensity',
                workouts: [
                    { dayOfWeek: 1, name: 'Threshold Work', type: 'THRESHOLD', duration: 75 },
                    { dayOfWeek: 3, name: 'Sprint Intervals', type: 'ANAEROBIC', duration: 50 },
                    { dayOfWeek: 5, name: 'Easy Spin', type: 'RECOVERY', duration: 45 },
                    { dayOfWeek: 6, name: 'Race Simulation', type: 'RACE', duration: 90 }
                ]
            },
            {
                week: 4,
                focus: 'Recovery Week',
                workouts: [
                    { dayOfWeek: 1, name: 'Easy Ride', type: 'RECOVERY', duration: 60 },
                    { dayOfWeek: 3, name: 'Light Tempo', type: 'TEMPO', duration: 45 },
                    { dayOfWeek: 6, name: 'Endurance Ride', type: 'ENDURANCE', duration: 90 }
                ]
            }
        ];

        await pool.query(`
            INSERT INTO mesocycles (id, athlete_id, name, start_date, end_date, status, structure, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            mesocycleId,
            TEST_ATHLETE_ID,
            '4-Week Base Building Plan',
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            'APPROVED',
            JSON.stringify(weeklyStructure),
            new Date()
        ]);

        log('CREATE_MESOCYCLE', true, `Mesocycle created: ${mesocycleId}`);
        return mesocycleId;
    } catch (error: any) {
        log('CREATE_MESOCYCLE', false, `Failed: ${error.message}`, error.detail);
        return null;
    }
}

async function step6_AssignWorkouts(mesocycleId: string): Promise<boolean> {
    console.log('\n========== STEP 6: ASSIGN WORKOUTS FROM MESOCYCLE ==========\n');
    try {
        const startDate = new Date();
        let assignmentCount = 0;

        const workouts = [
            { day: 1, name: 'Endurance Ride', type: 'ENDURANCE' },
            { day: 3, name: 'Tempo Intervals', type: 'TEMPO' },
            { day: 5, name: 'Recovery Spin', type: 'RECOVERY' },
            { day: 6, name: 'Long Ride', type: 'ENDURANCE' }
        ];

        for (const workout of workouts) {
            const workoutDate = new Date(startDate);
            workoutDate.setDate(workoutDate.getDate() + workout.day);

            const assignmentId = `assign_${Date.now()}_${workout.day}_${Math.random().toString(36).substring(7)}`;

            await pool.query(`
                INSERT INTO assignments (id, athlete_id, date, workout_id, workout_name, status, notes, assigned_by, created_at, workout_structure)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                assignmentId,
                TEST_ATHLETE_ID,
                workoutDate.toISOString().split('T')[0],
                `${mesocycleId}_w1_d${workout.day}`,
                workout.name,
                'PENDING',
                `Auto-assigned from mesocycle`,
                COACH_ID,
                new Date(),
                JSON.stringify({ type: workout.type, intervals: [] })
            ]);

            assignmentCount++;
        }

        log('ASSIGN_WORKOUTS', true, `Assigned ${assignmentCount} workouts to athlete`);
        return true;
    } catch (error: any) {
        log('ASSIGN_WORKOUTS', false, `Failed: ${error.message}`, error.detail);
        return false;
    }
}

async function step7_VerifyAthleteData(): Promise<boolean> {
    console.log('\n========== STEP 7: VERIFY COMPLETE ATHLETE DATA ==========\n');
    try {
        // Get athlete
        const { rows: athletes } = await pool.query('SELECT * FROM athletes WHERE id = $1', [TEST_ATHLETE_ID]);
        if (athletes.length === 0) {
            log('VERIFY_ATHLETE', false, 'Athlete not found in database!');
            return false;
        }
        const athlete = athletes[0];

        // Get assignments
        const { rows: assignments } = await pool.query('SELECT * FROM assignments WHERE athlete_id = $1', [TEST_ATHLETE_ID]);

        // Get mesocycles
        const { rows: mesocycles } = await pool.query('SELECT * FROM mesocycles WHERE athlete_id = $1', [TEST_ATHLETE_ID]);

        // Get diary
        const { rows: diary } = await pool.query('SELECT * FROM diary_entries WHERE athlete_id = $1', [TEST_ATHLETE_ID]);

        const summary = {
            athleteName: athlete.name,
            ftp: athlete.ftp,
            cp: athlete.cp,
            status: athlete.status,
            assignmentsCount: assignments.length,
            mesocyclesCount: mesocycles.length,
            diaryEntriesCount: diary.length,
            documentsStatus: athlete.extra_data?.documentsStatus || 'unknown'
        };

        console.log('\n   📊 ATHLETE SUMMARY:');
        console.log(`   Name: ${summary.athleteName}`);
        console.log(`   FTP: ${summary.ftp}W | CP: ${summary.cp}W`);
        console.log(`   Assignments: ${summary.assignmentsCount}`);
        console.log(`   Mesocycles: ${summary.mesocyclesCount}`);
        console.log(`   HRV Entries: ${summary.diaryEntriesCount}`);
        console.log(`   Documents: ${summary.documentsStatus}`);

        log('VERIFY_ATHLETE', true, 'Athlete data verified successfully');
        return true;
    } catch (error: any) {
        log('VERIFY_ATHLETE', false, `Failed: ${error.message}`, error.detail);
        return false;
    }
}

async function cleanup() {
    console.log('\n========== CLEANUP: REMOVE TEST DATA ==========\n');
    try {
        await pool.query('DELETE FROM assignments WHERE athlete_id = $1', [TEST_ATHLETE_ID]);
        await pool.query('DELETE FROM mesocycles WHERE athlete_id = $1', [TEST_ATHLETE_ID]);
        await pool.query('DELETE FROM diary_entries WHERE athlete_id = $1', [TEST_ATHLETE_ID]);
        await pool.query('DELETE FROM athletes WHERE id = $1', [TEST_ATHLETE_ID]);

        log('CLEANUP', true, 'Test data removed successfully');
    } catch (error: any) {
        log('CLEANUP', false, `Failed: ${error.message}`, error.detail);
    }
}

async function printSummary() {
    console.log('\n\n========================================');
    console.log('         SIMULATION SUMMARY');
    console.log('========================================\n');

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Total Steps: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('\nDetailed Results:');
    console.log('─'.repeat(50));

    for (const result of results) {
        const emoji = result.success ? '✅' : '❌';
        console.log(`${emoji} ${result.step}: ${result.message}`);
    }

    console.log('─'.repeat(50));

    if (failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! The flow is working correctly.\n');
    } else {
        console.log(`\n⚠️ ${failed} step(s) failed. Review the errors above.\n`);
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     CYCLING COACH PLATFORM - FULL FLOW SIMULATION v2       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Database: ${process.env.DATABASE_URL ? 'Connected to Supabase' : 'NO DATABASE_URL!'}`);
    console.log(`Test Athlete ID: ${TEST_ATHLETE_ID}`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    try {
        // Run all steps sequentially, stopping if athlete creation fails
        const athleteCreated = await step1_CreateAthlete();

        if (!athleteCreated) {
            console.log('\n❌ Cannot continue without athlete. Aborting.\n');
            await printSummary();
            await pool.end();
            return;
        }

        await step2_UpdatePhysiologicalData();
        await step3_SimulateDocumentUpload();
        await step4_AddHRVData();

        const mesocycleId = await step5_CreateMesocycle();
        if (mesocycleId) {
            await step6_AssignWorkouts(mesocycleId);
        }

        await step7_VerifyAthleteData();

        // Cleanup test data
        await cleanup();

    } catch (error: any) {
        console.error('FATAL ERROR:', error.message);
    } finally {
        await printSummary();
        await pool.end();
    }
}

main();
