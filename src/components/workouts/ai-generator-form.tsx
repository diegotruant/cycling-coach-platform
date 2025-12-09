'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateAIWorkoutAction } from "@/app/actions/ai";
import { Loader2, Sparkles } from "lucide-react";

interface AIGeneratorFormProps {
    ftp: number;
    onWorkoutGenerated: (workout: any) => void;
}

export function AIGeneratorForm({ ftp, onWorkoutGenerated }: AIGeneratorFormProps) {
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState(60);
    const [type, setType] = useState('ENDURANCE');
    const [focus, setFocus] = useState('');

    const handleGenerate = async () => {
        setLoading(true);
        const result = await generateAIWorkoutAction({
            ftp,
            durationMinutes: duration,
            type: type as any,
            focus
        });
        setLoading(false);

        if (result.success) {
            onWorkoutGenerated(result.workout);
        }
    };

    return (
        <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">AI Workout Generator</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="RECOVERY">Recovery</SelectItem>
                            <SelectItem value="ENDURANCE">Endurance</SelectItem>
                            <SelectItem value="TEMPO">Tempo</SelectItem>
                            <SelectItem value="THRESHOLD">Threshold</SelectItem>
                            <SelectItem value="VO2MAX">VO2max</SelectItem>
                            <SelectItem value="ANAEROBIC">Anaerobic</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Specific Focus (Optional)</Label>
                <Input placeholder="e.g. Low cadence, Sprints..." value={focus} onChange={e => setFocus(e.target.value)} />
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate with Gemini
            </Button>
        </div>
    );
}
