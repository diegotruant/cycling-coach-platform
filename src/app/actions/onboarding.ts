'use server';

import { getAthlete, updateAthlete, AthleteConfig } from '@/lib/storage';
import { uploadDocument as uploadToSupabase, downloadDocument } from '@/lib/supabase-storage';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { revalidatePath } from 'next/cache';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function uploadDocument(athleteId: string, formData: FormData) {
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'QUESTIONNAIRE' | 'ANAMNESIS' | 'ETHICS' | 'MEDICAL_CERTIFICATE';

    if (!file || !type) {
        return { success: false, error: 'Missing file or type' };
    }

    try {
        const athlete = await getAthlete(athleteId);
        if (!athlete) throw new Error('Athlete not found');

        // Generate filename
        const ext = file.name.split('.').pop() || 'pdf';
        const filename = `${type.toLowerCase()}_${Date.now()}.${ext}`;

        // Upload to Supabase Storage
        const buffer = Buffer.from(await file.arrayBuffer());
        const { url, path: storagePath } = await uploadToSupabase(athleteId, type, buffer, filename);

        // Update athlete config
        const documents = athlete.documents || [];
        const existingDocIndex = documents.findIndex(d => d.type === type);

        const newDocEntry = {
            type,
            status: 'UPLOADED' as const,
            url,
            storagePath, // Store the Supabase path for later retrieval
            uploadedAt: new Date().toISOString(),
            filename: file.name // Original filename
        };

        if (existingDocIndex >= 0) {
            documents[existingDocIndex] = { ...documents[existingDocIndex], ...newDocEntry };
        } else {
            documents.push(newDocEntry);
        }

        await updateAthlete(athleteId, { documents });

        // If Medical Certificate, analyze it
        if (type === 'MEDICAL_CERTIFICATE') {
            await analyzeMedicalCertificate(athleteId, storagePath);
        }

        revalidatePath('/athlete/onboarding');
        revalidatePath(`/coach/athletes/${athleteId}`);
        return { success: true };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'Failed to upload document' };
    }
}

async function analyzeMedicalCertificate(athleteId: string, storagePath: string) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('Skipping AI analysis: No API Key');
            return;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Download file from Supabase Storage
        const fileContent = await downloadDocument(storagePath);
        if (!fileContent) {
            console.error('Failed to download document for analysis');
            return;
        }

        // Convert to base64
        const base64Data = fileContent.toString('base64');
        const mimeType = storagePath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

        const prompt = "Analyze this medical certificate. Extract the expiration date. Return ONLY the date in YYYY-MM-DD format. If no date found or invalid, return 'INVALID'.";

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType
                }
            }
        ]);

        const response = result.response;
        const text = response.text().trim();

        console.log('AI Analysis Result:', text);

        let status: 'VERIFIED' | 'EXPIRED' | 'REJECTED' = 'VERIFIED';
        let expirationDate = text;

        if (text === 'INVALID') {
            status = 'REJECTED';
            expirationDate = '';
        } else {
            // Check if expired
            const expDate = new Date(text);
            const today = new Date();
            if (expDate < today) {
                status = 'EXPIRED';
            }

            // Check if expiring soon (e.g. 30 days)
            const warningDate = new Date();
            warningDate.setDate(today.getDate() + 30);
            if (expDate < warningDate && expDate >= today) {
                // TODO: Send alert to coach/athlete
                console.log('ALERT: Certificate expiring soon');
            }
        }

        // Update athlete config with analysis result
        const athlete = await getAthlete(athleteId);
        if (athlete && athlete.documents) {
            const docs = athlete.documents.map(d => {
                if (d.type === 'MEDICAL_CERTIFICATE') {
                    return { ...d, status, expirationDate };
                }
                return d;
            });
            await updateAthlete(athleteId, { documents: docs });
        }

    } catch (error) {
        console.error('AI Analysis failed:', error);
    }
}

export async function checkOnboardingStatus(athleteId: string) {
    const athlete = await getAthlete(athleteId);
    if (!athlete) return { completed: false };

    const requiredTypes = ['QUESTIONNAIRE', 'ANAMNESIS', 'ETHICS', 'MEDICAL_CERTIFICATE'];
    const uploadedTypes = athlete.documents?.map(d => d.type) || [];

    const allUploaded = requiredTypes.every(t => uploadedTypes.includes(t as any));
    const medCert = athlete.documents?.find(d => d.type === 'MEDICAL_CERTIFICATE');
    // Allow UPLOADED status to avoid blocking athletes while AI analysis runs
    const medCertValid = medCert?.status === 'VERIFIED' || medCert?.status === 'UPLOADED';

    const completed = allUploaded && medCertValid;

    if (completed && !athlete.onboardingCompleted) {
        await updateAthlete(athleteId, { onboardingCompleted: true });
    }

    return {
        completed,
        documents: athlete.documents || [],
        medCertStatus: medCert?.status
    };
}
