/**
 * Workout Generator - Modulators
 * 
 * Logic to modify workout parameters based on adaptive adjustment factors.
 */

import { WorkoutTemplate } from './library';
import { WorkoutAdjustment } from '../planner/adaptive_logic';

export function modulateWorkout(template: WorkoutTemplate, adjustment: WorkoutAdjustment): WorkoutTemplate {
    if (adjustment.action === 'KEEP') {
        return template;
    }

    if (adjustment.action === 'RECOVERY_RIDE') {
        // Replace entire workout with recovery
        // In a real system, we'd fetch the 'recovery_spin' template
        // For now, we return a modified version indicating recovery
        return {
            ...template,
            name: `[RECOVERY] ${template.name}`,
            description: `Replaced with recovery ride due to: ${adjustment.reason}`,
            intervals: [
                { type: 'WORK', duration: '45min', intensity: 'Z1 (Recovery)' }
            ]
        };
    }

    const modifiedIntervals = template.intervals.map(interval => {
        const newInterval = { ...interval };

        // Modulate Intensity
        // Note: Parsing strings like "95-100% pVO2max" is complex. 
        // Here we just append the instruction or modify if simple.
        if (interval.type === 'WORK') {
            newInterval.intensity = `${interval.intensity} (Scaled x${adjustment.intensityFactor})`;
        }

        // Modulate Rest Duration
        if (interval.type === 'REST' && adjustment.restIncreaseFactor > 1.0) {
            // Simple string replacement for "3min" -> "4min" logic would go here
            // For now, appending instruction
            newInterval.duration = `${interval.duration} (Extended x${adjustment.restIncreaseFactor})`;
        }

        return newInterval;
    });

    // Modulate Volume (Number of intervals)
    // If volumeFactor < 1, remove some work intervals
    let finalIntervals = modifiedIntervals;
    if (adjustment.volumeFactor < 1.0) {
        const workIntervals = modifiedIntervals.filter(i => i.type === 'WORK');
        const intervalsToRemove = Math.ceil(workIntervals.length * (1 - adjustment.volumeFactor));

        // Remove last N work intervals (and associated rests)
        // This is a naive implementation
        const removedCount = 0;
        finalIntervals = [];

        // Reconstruct
        // ... complex logic to remove intervals from the end of the main set
        // For prototype, we'll just tag the workout description
    }

    return {
        ...template,
        name: `[MODIFIED] ${template.name}`,
        description: `${template.description} | Adjusted: ${adjustment.reason}`,
        intervals: finalIntervals
    };
}
