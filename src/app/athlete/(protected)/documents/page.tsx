import { cookies } from "next/headers";
import { getAthlete } from "@/lib/storage";
import { redirect } from "next/navigation";
import { FileText, Upload, CheckCircle, AlertTriangle, Clock, Download } from "lucide-react";
import UploadDocumentForm from "@/components/upload-document-form";

export const dynamic = 'force-dynamic';

interface Document {
    type: string;
    status: string;
    url?: string;
    uploadedAt?: string;
    expirationDate?: string;
    filename?: string;
}

const DOCUMENT_TYPES = [
    {
        id: 'MEDICAL_CERTIFICATE',
        label: 'Certificato Medico Agonistico',
        description: 'Certificato medico per attività sportiva agonistica. Deve essere rinnovato annualmente.',
        required: true,
        expiresYearly: true
    },
    {
        id: 'QUESTIONNAIRE',
        label: 'Questionario Atleta',
        description: 'Informazioni su obiettivi, disponibilità e preferenze di allenamento.',
        required: true,
        expiresYearly: false
    },
    {
        id: 'ANAMNESIS',
        label: 'Anamnesi Sportiva',
        description: 'Storia clinica e sportiva dell\'atleta.',
        required: true,
        expiresYearly: false
    },
    {
        id: 'ETHICS',
        label: 'Codice Etico e Privacy',
        description: 'Accettazione del codice etico e consenso privacy.',
        required: true,
        expiresYearly: false
    }
];

function getStatusInfo(doc: Document | undefined, docType: typeof DOCUMENT_TYPES[0]) {
    if (!doc) {
        return {
            status: 'missing',
            label: 'Non caricato',
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            icon: AlertTriangle
        };
    }

    if (doc.status === 'EXPIRED' || (doc.expirationDate && new Date(doc.expirationDate) < new Date())) {
        return {
            status: 'expired',
            label: 'Scaduto',
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            icon: AlertTriangle
        };
    }

    if (doc.status === 'VERIFIED') {
        // Check if expiring soon (within 30 days)
        if (doc.expirationDate) {
            const expDate = new Date(doc.expirationDate);
            const warningDate = new Date();
            warningDate.setDate(warningDate.getDate() + 30);
            if (expDate < warningDate) {
                return {
                    status: 'expiring',
                    label: `Scade il ${expDate.toLocaleDateString('it-IT')}`,
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-500/10',
                    icon: Clock
                };
            }
        }
        return {
            status: 'verified',
            label: 'Verificato',
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            icon: CheckCircle
        };
    }

    if (doc.status === 'UPLOADED') {
        return {
            status: 'pending',
            label: 'In verifica',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10',
            icon: Clock
        };
    }

    return {
        status: 'unknown',
        label: doc.status,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        icon: FileText
    };
}

export default async function AthleteDocumentsPage() {
    const cookieStore = await cookies();
    const athleteId = cookieStore.get('athlete_session')?.value;

    if (!athleteId) {
        redirect('/athlete/login');
    }

    const athlete = await getAthlete(athleteId);
    if (!athlete) {
        redirect('/athlete/login');
    }

    const documents = athlete.documents || [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">I Miei Documenti</h1>
                <p className="text-muted-foreground mt-2">
                    Gestisci i tuoi documenti. Il certificato medico deve essere aggiornato annualmente.
                </p>
            </div>

            {/* Alert for expiring documents */}
            {documents.some(d => {
                if (d.type === 'MEDICAL_CERTIFICATE' && d.expirationDate) {
                    const expDate = new Date(d.expirationDate);
                    const warningDate = new Date();
                    warningDate.setDate(warningDate.getDate() + 30);
                    return expDate < warningDate;
                }
                return false;
            }) && (
                    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            <p className="font-medium text-yellow-500">
                                Il tuo certificato medico sta per scadere. Ricordati di caricarne uno nuovo!
                            </p>
                        </div>
                    </div>
                )}

            <div className="grid gap-6">
                {DOCUMENT_TYPES.map(docType => {
                    const doc = documents.find(d => d.type === docType.id);
                    const statusInfo = getStatusInfo(doc, docType);
                    const StatusIcon = statusInfo.icon;

                    return (
                        <div key={docType.id} className="rounded-xl border border-border bg-card p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FileText className="h-6 w-6 text-primary" />
                                        <h3 className="text-lg font-semibold">{docType.label}</h3>
                                        {docType.required && (
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                Obbligatorio
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {docType.description}
                                    </p>

                                    {/* Status Badge */}
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusInfo.bgColor}`}>
                                        <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                                        <span className={`text-sm font-medium ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    {/* Document info if uploaded */}
                                    {doc && doc.uploadedAt && (
                                        <div className="mt-3 text-sm text-muted-foreground">
                                            <p>Caricato il: {new Date(doc.uploadedAt).toLocaleDateString('it-IT')}</p>
                                            {doc.expirationDate && (
                                                <p>Scadenza: {new Date(doc.expirationDate).toLocaleDateString('it-IT')}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 lg:w-64">
                                    {doc && doc.url && (
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
                                        >
                                            <Download className="h-4 w-4" />
                                            <span>Visualizza</span>
                                        </a>
                                    )}
                                    <UploadDocumentForm
                                        athleteId={athleteId}
                                        documentType={docType.id}
                                        buttonText={doc ? "Ricarica documento" : "Carica documento"}
                                        buttonVariant={doc ? "outline" : "default"}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info box */}
            <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h4 className="font-medium mb-2">ℹ️ Informazioni</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Il <strong>certificato medico agonistico</strong> viene analizzato automaticamente per estrarre la data di scadenza.</li>
                    <li>• Riceverai una notifica quando il certificato sta per scadere.</li>
                    <li>• Puoi ricaricare un documento in qualsiasi momento per aggiornarlo.</li>
                    <li>• Formati supportati: PDF, JPG, PNG (max 10MB)</li>
                </ul>
            </div>
        </div>
    );
}
