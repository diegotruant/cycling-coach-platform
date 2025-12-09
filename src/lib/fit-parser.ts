// @ts-ignore
import FitParser from 'fit-file-parser';

export interface FitDataPoint {
    timestamp: Date;
    power?: number;
    heart_rate?: number;
    cadence?: number;
    speed?: number;
    distance?: number;
}

export interface ParsedActivity {
    timestamp: Date;
    records: FitDataPoint[];
    total_timer_time?: number;
    total_distance?: number;
    avg_power?: number;
    max_power?: number;
    avg_heart_rate?: number;
    max_heart_rate?: number;
}

export function parseFitFile(buffer: Buffer): Promise<ParsedActivity> {
    return new Promise((resolve, reject) => {
        const parser = new FitParser({
            force: true,
            speedUnit: 'km/h',
            lengthUnit: 'km',
            temperatureUnit: 'celsius',
            elapsedRecordField: true,
            mode: 'cascade',
        });

        parser.parse(buffer, (error: any, data: any) => {
            if (error) {
                reject(error);
            } else {
                try {
                    // Extract relevant data
                    const activity = data.activity;

                    if (!activity || !activity.sessions || activity.sessions.length === 0) {
                        reject(new Error('Invalid FIT file structure: no sessions found'));
                        return;
                    }

                    const session = activity.sessions[0];

                    // Handle different FIT file structures
                    let records: FitDataPoint[] = [];

                    if (session.laps && session.laps.length > 0) {
                        // Structure with laps
                        records = session.laps
                            .flatMap((lap: any) => lap.records || [])
                            .map((record: any) => ({
                                timestamp: new Date(record.timestamp),
                                power: record.power,
                                heart_rate: record.heart_rate,
                                cadence: record.cadence,
                                speed: record.speed,
                                distance: record.distance,
                            }));
                    }

                    // Fallback 1: Check session.records (some Garmin devices)
                    if (records.length === 0 && session.records && session.records.length > 0) {
                        records = session.records.map((record: any) => ({
                            timestamp: new Date(record.timestamp),
                            power: record.power,
                            heart_rate: record.heart_rate,
                            cadence: record.cadence,
                            speed: record.speed,
                            distance: record.distance,
                        }));
                    }

                    // Fallback 2: Check activity.records (root level)
                    if (records.length === 0 && activity.records && activity.records.length > 0) {
                        // Direct records
                        records = activity.records.map((record: any) => ({
                            timestamp: new Date(record.timestamp),
                            power: record.power,
                            heart_rate: record.heart_rate,
                            cadence: record.cadence,
                            speed: record.speed,
                            distance: record.distance,
                        }));
                    }

                    resolve({
                        timestamp: new Date(session.timestamp || session.start_time),
                        total_timer_time: session.total_timer_time,
                        total_distance: session.total_distance,
                        avg_power: session.avg_power,
                        max_power: session.max_power,
                        avg_heart_rate: session.avg_heart_rate,
                        max_heart_rate: session.max_heart_rate,
                        records,
                    });
                } catch (parseError) {
                    reject(new Error(`Failed to parse FIT data: ${parseError}`));
                }
            }
        });
    });
}
