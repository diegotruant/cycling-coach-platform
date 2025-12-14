'use server';

import { getAthlete, updateAthlete, saveDocument, AthleteConfig } from '@/lib/storage';
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

        // Save to Database (New Table)
        await saveDocument(athleteId, {
            type,
            status: 'UPLOADED',
            fileUrl: url,
            storagePath,
            uploadedAt: new Date().toISOString(),
            metadata: { filename: file.name, size: file.size, mimeType: file.type }
        });

        // If Medical Certificate, analyze it
        if (type === 'MEDICAL_CERTIFICATE') {
            // Run async to not block UI? No, usually server actions await.
            // We can await it.
            await analyzeMedicalCertificate(athleteId, storagePath);
        }

        revalidatePath('/athlete/documents');
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

        // Update DB
        // We need to find the document ID to update, OR simple update by type + athleteId (handled by saveDocument helper I wrote?)
        // saveDocument uses ID if provided, or insert.
        // I need to update my saveDocument or write a raw query here to update by type? 
        // Or get the doc first.

        // Let's first get the list to find the ID of the cert we just uploaded.
        // Actually, documents are unique by type usually? No, could have history.
        // We want to update the MOST RECENT one.
        const athlete = await getAthlete(athleteId);
        const latestCert = athlete?.documents?.find(d => d.type === 'MEDICAL_CERTIFICATE' && d.storagePath === storagePath);

        if (latestCert) {
            await saveDocument(athleteId, {
                id: latestCert.id,
                status,
                expirationDate: expirationDate || undefined,
                type: 'MEDICAL_CERTIFICATE' // Required by partial
            });
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
