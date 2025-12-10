'use client';

import { FileText, Download, CheckCircle, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Document {
    type: string;
    status: string;
    url?: string;
    storagePath?: string;
    uploadedAt?: string;
    expirationDate?: string;
    filename?: string;
}

interface AthleteDocumentsViewProps {
    documents: Document[];
    athleteId: string;
    athleteName: string;
}

const DOCUMENT_LABELS: Record<string, string> = {
    'MEDICAL_CERTIFICATE': 'Certificato Medico Agonistico',
    'QUESTIONNAIRE': 'Questionario Atleta',
    'ANAMNESIS': 'Anamnesi Sportiva',
    'ETHICS': 'Codice Etico e Privacy'
};

function getStatusInfo(doc: Document) {
    if (doc.status === 'EXPIRED' || (doc.expirationDate && new Date(doc.expirationDate) < new Date())) {
        return {
            label: 'Scaduto',
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            icon: AlertTriangle
        };
    }

    if (doc.status === 'VERIFIED') {
        if (doc.expirationDate) {
            const expDate = new Date(doc.expirationDate);
            const warningDate = new Date();
            warningDate.setDate(warningDate.getDate() + 30);
            if (expDate < warningDate) {
                return {
                    label: `Scade il ${expDate.toLocaleDateString('it-IT')}`,
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-500/10',
                    icon: Clock
                };
            }
        }
        return {
            label: 'Verificato',
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            icon: CheckCircle
        };
    }

    if (doc.status === 'UPLOADED') {
        return {
            label: 'Caricato',
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            icon: FileText
        };
    }

    if (doc.status === 'REJECTED') {
        return {
            label: 'Rifiutato',
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            icon: AlertTriangle
        };
    }

    return {
        label: doc.status,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        icon: FileText
    };
}

export function AthleteDocumentsView({ documents, athleteId, athleteName }: AthleteDocumentsViewProps) {
    const requiredTypes = ['MEDICAL_CERTIFICATE', 'QUESTIONNAIRE', 'ANAMNESIS', 'ETHICS'];

    // Check for missing or expired documents
    const issues: string[] = [];

    const medCert = documents.find(d => d.type === 'MEDICAL_CERTIFICATE');
    if (!medCert) {
        issues.push('Certificato medico mancante');
    } else if (medCert.status === 'EXPIRED' || (medCert.expirationDate && new Date(medCert.expirationDate) < new Date())) {
        issues.push('Certificato medico scaduto');
    } else if (medCert.expirationDate) {
        const expDate = new Date(medCert.expirationDate);
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() + 30);
        if (expDate < warningDate) {
            issues.push(`Certificato medico in scadenza (${expDate.toLocaleDateString('it-IT')})`);
        }
    }

    const missingDocs = requiredTypes.filter(type => !documents.find(d => d.type === type));
    if (missingDocs.length > 0 && missingDocs.length < 4) {
        issues.push(`${missingDocs.length} documento/i mancante/i`);
    }

    return (
        <div className="space-y-6">
            {/* Alert for issues */}
            {issues.length > 0 && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                            <p className="font-medium text-yellow-700 dark:text-yellow-400">
                                Attenzione: problemi con i documenti
                            </p>
                            <ul className="mt-1 text-sm text-yellow-600 dark:text-yellow-300 list-disc list-inside">
                                {issues.map((issue, i) => (
                                    <li key={i}>{issue}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Documents Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {requiredTypes.map(type => {
                    const doc = documents.find(d => d.type === type);
                    const label = DOCUMENT_LABELS[type] || type;

                    if (!doc) {
                        return (
                            <div key={type} className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{label}</p>
                                        <p className="text-sm text-muted-foreground">Non caricato</p>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    const statusInfo = getStatusInfo(doc);
                    const StatusIcon = statusInfo.icon;

                    return (
                        <div key={type} className="rounded-lg border border-border bg-card p-4">
                            <div className="flex items-start gap-3">
                                <div className={`h-10 w-10 rounded-full ${statusInfo.bgColor} flex items-center justify-center`}>
                                    <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium">{label}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-sm ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    {doc.uploadedAt && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Caricato: {new Date(doc.uploadedAt).toLocaleDateString('it-IT')}
                                        </p>
                                    )}
                                    {doc.expirationDate && (
                                        <p className="text-xs text-muted-foreground">
                                            Scadenza: {new Date(doc.expirationDate).toLocaleDateString('it-IT')}
                                        </p>
                                    )}
                                </div>
                                {doc.url && (
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0"
                                    >
                                        <Button variant="outline" size="sm">
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            Apri
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="text-sm text-muted-foreground">
                <p>
                    Documenti completi: {documents.length}/{requiredTypes.length}
                </p>
            </div>
        </div>
    );
}
