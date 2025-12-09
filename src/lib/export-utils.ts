import { PMCDataPoint } from "./physiology/pmc";
import { AthleteConfig } from "./storage";

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: any[], headers: string[]): string {
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            // Escape values that contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

/**
 * Trigger download of a file
 */
function downloadFile(content: string, filename: string, mimeType: string = 'text/csv') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export PMC data to CSV
 */
export function exportPMCToCSV(pmcData: PMCDataPoint[], athleteName: string) {
    const headers = ['date', 'ctl', 'atl', 'tsb', 'tss'];
    const csv = arrayToCSV(pmcData, headers);
    const filename = `${athleteName.replace(/\s+/g, '_')}_PMC_${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(csv, filename);
}

/**
 * Export power curve to CSV
 */
export function exportPowerCurveToCSV(
    powerCurve: Array<{ duration: number; watts: number; date: string }>,
    athleteName: string
) {
    const headers = ['duration_seconds', 'watts', 'date'];
    const csv = arrayToCSV(powerCurve, headers);
    const filename = `${athleteName.replace(/\s+/g, '_')}_PowerCurve_${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(csv, filename);
}

/**
 * Export activities to CSV
 */
export function exportActivitiesToCSV(assignments: AthleteConfig['assignments'], athleteName: string) {
    if (!assignments || assignments.length === 0) {
        alert('No activities to export');
        return;
    }

    // Filter completed activities with data
    const activities = assignments
        .filter(a => a.status === 'COMPLETED' && a.activityData)
        .map(a => ({
            date: a.date,
            workout_name: a.workoutName,
            duration_seconds: a.activityData?.duration || 0,
            distance_meters: a.activityData?.distance || 0,
            tss: a.activityData?.tss || 0,
            intensity_factor: a.activityData?.if || 0,
            normalized_power: a.activityData?.np || 0,
            average_power: a.activityData?.avgPower || 0,
            average_hr: a.activityData?.avgHr || 0,
            calories: a.activityData?.calories || 0,
            elevation_gain: a.activityData?.elevationGain || 0,
        }));

    if (activities.length === 0) {
        alert('No completed activities to export');
        return;
    }

    const headers = [
        'date',
        'workout_name',
        'duration_seconds',
        'distance_meters',
        'tss',
        'intensity_factor',
        'normalized_power',
        'average_power',
        'average_hr',
        'calories',
        'elevation_gain'
    ];

    const csv = arrayToCSV(activities, headers);
    const filename = `${athleteName.replace(/\s+/g, '_')}_Activities_${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(csv, filename);
}

/**
 * Export all performance data as a ZIP (requires additional library)
 * For now, we'll export as separate files
 */
export function exportAllData(
    pmcData: PMCDataPoint[],
    powerCurve: Array<{ duration: number; watts: number; date: string }>,
    assignments: AthleteConfig['assignments'],
    athleteName: string
) {
    exportPMCToCSV(pmcData, athleteName);

    if (powerCurve && powerCurve.length > 0) {
        setTimeout(() => exportPowerCurveToCSV(powerCurve, athleteName), 100);
    }

    if (assignments && assignments.length > 0) {
        setTimeout(() => exportActivitiesToCSV(assignments, athleteName), 200);
    }
}
