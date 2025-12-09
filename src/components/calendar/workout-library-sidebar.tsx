
'use client';

import { WORKOUT_LIBRARY, WORKOUT_CATEGORIES } from '@/lib/workouts/library';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dumbbell, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function WorkoutLibrarySidebar() {

    // Helper to get color for category
    const getCategoryColor = (category: string) => {
        switch (category) {
            case WORKOUT_CATEGORIES.RECOVERY: return "border-l-emerald-400";
            case WORKOUT_CATEGORIES.ENDURANCE: return "border-l-green-500";
            case WORKOUT_CATEGORIES.TEMPO: return "border-l-blue-500";
            case WORKOUT_CATEGORIES.THRESHOLD: return "border-l-yellow-500";
            case WORKOUT_CATEGORIES.VO2MAX: return "border-l-orange-500";
            case WORKOUT_CATEGORIES.ANAEROBIC: return "border-l-red-600";
            case WORKOUT_CATEGORIES.TEST: return "border-l-purple-600";
            default: return "border-l-slate-400";
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, workoutId: string, workoutName: string) => {
        e.dataTransfer.setData('workoutId', workoutId);
        e.dataTransfer.effectAllowed = 'copy';
        // Optional: Custom drag image
    };

    return (
        <div className="flex flex-col h-full border-r bg-muted/10 w-64 shrink-0">
            <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    Libreria Workout
                </h3>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {Object.entries(WORKOUT_LIBRARY).map(([category, workouts]) => (
                        <div key={category} className="space-y-3">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{category}</h4>
                            <div className="space-y-2">
                                {workouts.map(workout => (
                                    <div
                                        key={workout.id}
                                        draggable="true"
                                        onDragStart={(e) => handleDragStart(e, workout.id, workout.name)}
                                        className={`group relative flex items-center gap-2 p-2.5 bg-card hover:bg-accent border rounded-md shadow-sm hover:shadow transition-all cursor-move border-l-4 ${getCategoryColor(category)}`}
                                    >
                                        <GripVertical className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{workout.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">{workout.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
