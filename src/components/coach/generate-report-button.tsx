
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AthleteConfig } from '@/lib/storage';

interface GenerateReportButtonProps {
    athlete: AthleteConfig;
}

export function GenerateReportButton({ athlete }: GenerateReportButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const doc = new jsPDF();

            // --- Helper Functions ---
            const addCenterText = (text: string, y: number, fontSize: number = 12, isBold: boolean = false) => {
                doc.setFontSize(fontSize);
                doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
                const x = (doc.internal.pageSize.width - textWidth) / 2;
                doc.text(text, x, y);
            };

            // --- 1. Header & Logo ---
            // Load Logo
            const logoUrl = '/logo.jpg';
            try {
                const img = new Image();
                img.src = logoUrl;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });

                // Add Logo Centered
                const imgWidth = 40;
                const imgHeight = 40; // Aspect ratio adjustment might be needed
                const x = (doc.internal.pageSize.width - imgWidth) / 2;
                doc.addImage(img, 'JPEG', x, 15, imgWidth, imgHeight);
            } catch (e) {
                console.error("Could not load logo", e);
                // Fallback text if logo fails
                addCenterText("DDTraining", 30, 24, true);
            }

            // Title
            addCenterText("REPORT MENSILE DELL'ALLENAMENTO", 65, 18, true);

            // Month
            const date = new Date();
            const monthName = date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
            addCenterText(`Periodo: ${monthName}`, 75, 12);

            // --- 2. Athlete Info ---
            doc.setFontSize(10);
            doc.text(`Atleta: ${athlete.name}`, 14, 90);
            doc.text(`Categoria: ${athlete.category || '-'}`, 14, 95);
            doc.text(`FTP Attuale: ${athlete.ftp || '-'} W`, 14, 100);
            doc.text(`Peso: ${athlete.weight || '-'} kg`, 150, 90);
            doc.text(`W/kg: ${athlete.ftp && athlete.weight ? (athlete.ftp / athlete.weight).toFixed(2) : '-'}`, 150, 95);

            // --- 3. Monthly Stats Calculation ---
            const currentMonth = date.getMonth();
            const currentYear = date.getFullYear();

            const monthlyAssignments = athlete.assignments?.filter(a => {
                const d = new Date(a.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear && a.status === 'COMPLETED';
            }) || [];

            const totalDuration = monthlyAssignments.reduce((acc, curr) => acc + (curr.activityData?.duration || 0), 0);
            const totalDistance = monthlyAssignments.reduce((acc, curr) => acc + (curr.activityData?.distance || 0), 0);
            const totalTSS = monthlyAssignments.reduce((acc, curr) => acc + (curr.activityData?.tss || 0), 0);
            const totalElevation = monthlyAssignments.reduce((acc, curr) => acc + (curr.activityData?.elevationGain || 0), 0);
            const workoutsCount = monthlyAssignments.length;

            const formatDuration = (seconds: number) => {
                const h = Math.floor(seconds / 3600);
                const m = Math.floor((seconds % 3600) / 60);
                return `${h}h ${m}m`;
            };

            // --- 4. Stats Table ---
            autoTable(doc, {
                startY: 110,
                head: [['Metrica', 'Valore']],
                body: [
                    ['Allenamenti Completati', workoutsCount.toString()],
                    ['Durata Totale', formatDuration(totalDuration)],
                    ['Distanza Totale', `${(totalDistance / 1000).toFixed(1)} km`],
                    ['Training Stress Score (TSS)', totalTSS.toFixed(0)],
                    ['Dislivello', `${totalElevation.toFixed(0)} m`],
                ],
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 11 }
            });

            // --- 5. Motivation & Summary ---
            // Assuming this is static for now or simple logic
            let summaryText = `Ottimo lavoro questo mese, ${athlete.name.split(' ')[0]}! `;
            if (workoutsCount > 10) {
                summaryText += "Hai mantenuto un'eccezionale costanza negli allenamenti. ";
            } else if (workoutsCount > 5) {
                summaryText += "Hai completato una buona base di lavoro. ";
            }
            summaryText += `Hai accumulato ${totalTSS} punti TSS, contribuendo significativamente alla tua fitness base. `;

            if (athlete.ftp && athlete.weight && (athlete.ftp / athlete.weight) > 4) {
                summaryText += "Il tuo rapporto potenza/peso è eccellente.";
            }

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Riepilogo & Adattamenti", 14, (doc as any).lastAutoTable.finalY + 15);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);

            // Word wrap the summary text
            const splitText = doc.splitTextToSize(summaryText, 180);
            doc.text(splitText, 14, (doc as any).lastAutoTable.finalY + 22);

            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages();
            doc.setFontSize(8);
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.text('Generato da DDTraining Platform', 14, 285);
                doc.text(`Pagina ${i} di ${pageCount}`, 180, 285);
            }

            doc.save(`Report_${athlete.name.replace(/\s+/g, '_')}_${monthName}.pdf`);

        } catch (error) {
            console.error("Failed to generate PDF", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button onClick={generatePDF} disabled={isGenerating} variant="outline" className="gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Report Mensile
        </Button>
    );
}
