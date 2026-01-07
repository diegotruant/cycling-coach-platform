import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkOnboardingStatus } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, AlertCircle, XCircle, Download } from "lucide-react";
import UploadDocumentForm from "@/components/upload-document-form";

export default async function OnboardingPage() {
    const cookieStore = await cookies();
    const athleteId = cookieStore.get('athlete_session')?.value;

    if (!athleteId) {
        redirect('/login');
    }

    const status = await checkOnboardingStatus(athleteId);

    if (status.completed) {
        redirect('/athlete');
    }

    const steps = [
        { id: 'QUESTIONNAIRE', title: 'Questionario Conoscitivo', description: 'Compila il questionario per aiutarci a conoscerti meglio.' },
        { id: 'ANAMNESIS', title: 'Scheda Anamnestica', description: 'Informazioni sulla tua storia clinica e sportiva.' },
        { id: 'ETHICS', title: 'Codice Etico', description: 'Leggi e firma il nostro codice di condotta.' },
        { id: 'MEDICAL_CERTIFICATE', title: 'Certificato Medico', description: 'Carica il tuo certificato medico agonistico in corso di validità.' },
    ];

    return (
        <div className="container max-w-3xl py-10 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Benvenuto nel Team! 🚴‍♂️</h1>
                <p className="text-muted-foreground">
                    Per iniziare il tuo percorso, abbiamo bisogno di alcuni documenti fondamentali.
                    <br />Completa tutti i passaggi per accedere alla tua dashboard.
                </p>
            </div>

            <div className="grid gap-6">
                {steps.map((step) => {
                    const doc = status.documents?.find(d => d.type === step.id);
                    const isUploaded = doc?.status === 'UPLOADED' || doc?.status === 'VERIFIED';
                    const isRejected = doc?.status === 'REJECTED' || doc?.status === 'EXPIRED';

                    return (
                        <Card key={step.id} className={`border-l-4 ${isUploaded && !isRejected ? 'border-l-green-500' :
                            isRejected ? 'border-l-red-500' : 'border-l-blue-500'
                            }`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            {step.title}
                                            {isUploaded && !isRejected && <CheckCircle className="h-5 w-5 text-green-500" />}
                                            {isRejected && <XCircle className="h-5 w-5 text-red-500" />}
                                        </CardTitle>
                                        <CardDescription>{step.description}</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={`/api/templates/${step.id.toLowerCase()}.pdf`} download>
                                                <Download className="h-4 w-4 mr-2" />
                                                Template
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isRejected && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        {doc?.status === 'EXPIRED' ? 'Certificato scaduto. Caricane uno valido.' : 'Documento non valido. Riprova.'}
                                    </div>
                                )}

                                {doc?.status === 'VERIFIED' && step.id === 'MEDICAL_CERTIFICATE' && (
                                    <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Verificato! Scadenza: {doc.expirationDate}
                                    </div>
                                )}

                                <UploadDocumentForm
                                    athleteId={athleteId}
                                    documentType={step.id}
                                    isUploaded={isUploaded && !isRejected}
                                />
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="flex justify-end">
                <Button disabled={!status.completed} size="lg" asChild>
                    <a href="/athlete">
                        Accedi alla Dashboard
                    </a>
                </Button>
            </div>
        </div>
    );
}
