'use server';

import fs from 'fs/promises';
import path from 'path';
import { getAthlete, updateAthlete, AthleteConfig } from '@/lib/storage';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { revalidatePath } from 'next/cache';

const DATA_DIR = path.join(process.cwd(), 'data');
const ATHLETES_DIR = path.join(DATA_DIR, 'Athletes');

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

        // Create documents directory if not exists
        const folderName = `${athlete.name.replace(/[^a-z0-9]/gi, '_')}_${athlete.id}`;
        const docsDir = path.join(ATHLETES_DIR, folderName, 'documents');
        await fs.mkdir(docsDir, { recursive: true });

        // Save file
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${type.toLowerCase()}_${Date.now()}${path.extname(file.name)}`;
        const filePath = path.join(docsDir, filename);
        await fs.writeFile(filePath, buffer);

        // Update athlete config
        const documents = athlete.documents || [];
        const existingDocIndex = documents.findIndex(d => d.type === type);

        const newDocEntry = {
            type,
            status: 'UPLOADED' as const,
            url: `/api/documents/${athleteId}/${filename}`, // We'll need an API route for serving
            uploadedAt: new Date().toISOString(),
        };

        if (existingDocIndex >= 0) {
            documents[existingDocIndex] = { ...documents[existingDocIndex], ...newDocEntry };
        } else {
            documents.push(newDocEntry);
        }

        await updateAthlete(athleteId, { documents });

        // If Medical Certificate, analyze it
        if (type === 'MEDICAL_CERTIFICATE') {
            await analyzeMedicalCertificate(athleteId, filePath);
        }

        revalidatePath('/athlete/onboarding');
        return { success: true };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'Failed to upload document' };
    }
}

async function analyzeMedicalCertificate(athleteId: string, filePath: string) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('Skipping AI analysis: No API Key');
            return;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const fileContent = await fs.readFile(filePath);

        // Convert to base64
        const base64Data = fileContent.toString('base64');
        const mimeType = path.extname(filePath) === '.pdf' ? 'application/pdf' : 'image/jpeg'; // Simplified

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
