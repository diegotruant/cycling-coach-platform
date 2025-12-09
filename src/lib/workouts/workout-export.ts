// Workout export utilities for various trainer formats

import { MesocycleWorkout } from '../periodization/types';

/**
 * Export workout to Zwift ZWO format
 */
export function exportToZWO(workout: MesocycleWorkout, ftp: number): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
    <author>DDTraining AI Coach</author>
    <name>${escapeXml(workout.name)}</name>
    <description>${escapeXml(workout.description)}</description>
    <sportType>bike</sportType>
    <tags></tags>
    <workout>
${workout.intervals.map((interval, idx) => {
        const powerLow = interval.power.min / ftp;
        const powerHigh = interval.power.max / ftp;
        const duration = interval.duration;
        const cadence = interval.cadence?.target || 90;

        if (interval.type === 'riscaldamento') {
            return `        <Warmup Duration="${duration}" PowerLow="${powerLow.toFixed(2)}" PowerHigh="${powerHigh.toFixed(2)}" pace="0">
            <textevent timeoffset="10" message="${escapeXml(interval.description)}"/>
        </Warmup>`;
        } else if (interval.type === 'defaticamento') {
            return `        <Cooldown Duration="${duration}" PowerLow="${powerLow.toFixed(2)}" PowerHigh="${powerHigh.toFixed(2)}" pace="0">
            <textevent timeoffset="10" message="${escapeXml(interval.description)}"/>
        </Cooldown>`;
        } else if (interval.type === 'recupero') {
            return `        <SteadyState Duration="${duration}" Power="${powerLow.toFixed(2)}" pace="0">
            <textevent timeoffset="10" message="${escapeXml(interval.description)}"/>
        </SteadyState>`;
        } else {
            return `        <SteadyState Duration="${duration}" Power="${((powerLow + powerHigh) / 2).toFixed(2)}" pace="0" Cadence="${cadence}">
            <textevent timeoffset="10" message="${escapeXml(interval.description)}"/>
        </SteadyState>`;
        }
    }).join('\n')}
    </workout>
</workout_file>`;

    return xml;
}

/**
 * Export workout to TrainerRoad MRC format
 */
export function exportToMRC(workout: MesocycleWorkout, ftp: number): string {
    let mrc = `[COURSE HEADER]\n`;
    mrc += `VERSION = 2\n`;
    mrc += `UNITS = ENGLISH\n`;
    mrc += `DESCRIPTION = ${workout.name}\n`;
    mrc += `FILE NAME = ${workout.name.replace(/\s+/g, '_')}\n`;
    mrc += `MINUTES PERCENT\n`;
    mrc += `[END COURSE HEADER]\n`;
    mrc += `[COURSE DATA]\n`;

    let currentTime = 0;
    workout.intervals.forEach(interval => {
        const durationMinutes = interval.duration / 60;
        const powerPercent = ((interval.power.min + interval.power.max) / 2 / ftp * 100).toFixed(1);

        mrc += `${(currentTime / 60).toFixed(2)}\t${powerPercent}\n`;
        currentTime += interval.duration;
        mrc += `${(currentTime / 60).toFixed(2)}\t${powerPercent}\n`;
    });

    mrc += `[END COURSE DATA]\n`;
    return mrc;
}

/**
 * Export workout to generic ERG format
 */
export function exportToERG(workout: MesocycleWorkout, ftp: number): string {
    let erg = `[COURSE HEADER]\n`;
    erg += `VERSION = 2\n`;
    erg += `UNITS = ENGLISH\n`;
    erg += `DESCRIPTION = ${workout.name} - ${workout.description}\n`;
    erg += `FILE NAME = ${workout.name.replace(/\s+/g, '_')}\n`;
    erg += `FTP = ${ftp}\n`;
    erg += `MINUTES WATTS\n`;
    erg += `[END COURSE HEADER]\n`;
    erg += `[COURSE DATA]\n`;

    let currentTime = 0;
    workout.intervals.forEach(interval => {
        const watts = Math.round((interval.power.min + interval.power.max) / 2);

        erg += `${(currentTime / 60).toFixed(2)}\t${watts}\n`;
        currentTime += interval.duration;
        erg += `${(currentTime / 60).toFixed(2)}\t${watts}\n`;
    });

    erg += `[END COURSE DATA]\n`;
    return erg;
}

/**
 * Export workout to JSON format (for custom apps)
 */
export function exportToJSON(workout: MesocycleWorkout, ftp: number): string {
    const exportData = {
        name: workout.name,
        description: workout.description,
        duration: workout.duration,
        tss: workout.tss,
        ftp: ftp,
        intervals: workout.intervals.map(interval => ({
            type: interval.type,
            duration: interval.duration,
            power: {
                min: interval.power.min,
                max: interval.power.max,
                target: interval.power.target,
                minPercent: Math.round(interval.power.min / ftp * 100),
                maxPercent: Math.round(interval.power.max / ftp * 100),
                targetPercent: Math.round(interval.power.target / ftp * 100)
            },
            cadence: interval.cadence,
            description: interval.description
        })),
        coachNotes: workout.coachNotes
    };

    return JSON.stringify(exportData, null, 2);
}

/**
 * Download file helper
 */
export function downloadWorkout(
    workout: MesocycleWorkout,
    format: 'zwo' | 'mrc' | 'erg' | 'json',
    ftp: number
) {
    let content: string;
    let filename: string;
    let mimeType: string;

    const baseName = workout.name.replace(/\s+/g, '_').toLowerCase();

    switch (format) {
        case 'zwo':
            content = exportToZWO(workout, ftp);
            filename = `${baseName}.zwo`;
            mimeType = 'application/xml';
            break;
        case 'mrc':
            content = exportToMRC(workout, ftp);
            filename = `${baseName}.mrc`;
            mimeType = 'text/plain';
            break;
        case 'erg':
            content = exportToERG(workout, ftp);
            filename = `${baseName}.erg`;
            mimeType = 'text/plain';
            break;
        case 'json':
            content = exportToJSON(workout, ftp);
            filename = `${baseName}.json`;
            mimeType = 'application/json';
            break;
        default:
            throw new Error(`Formato non supportato: ${format}`);
    }

    // Create blob and download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Helper to escape XML special characters
function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
