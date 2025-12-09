import { cookies } from "next/headers";
import { getAthlete } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAthleteProfile } from "@/app/actions/profile";
import { User, Activity, TrendingUp } from "lucide-react";

export default async function ProfilePage() {
    const cookieStore = await cookies();
    const athleteId = cookieStore.get('athlete_session')?.value;

    if (!athleteId) {
        return <div>Not logged in</div>;
    }

    const athlete = await getAthlete(athleteId);

    if (!athlete) {
        return <div>Athlete not found</div>;
    }

    async function handleSubmit(formData: FormData) {
        'use server';
        await updateAthleteProfile(athleteId!, formData);
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your personal information and view your physiological profile.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information Card */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5" />
                        <h2 className="text-xl font-semibold">Personal Information</h2>
                    </div>

                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="weight">Weight (kg)</Label>
                            <Input
                                id="weight"
                                name="weight"
                                type="number"
                                step="0.1"
                                defaultValue={athlete.weight || ''}
                                placeholder="70.0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="height">Height (cm)</Label>
                            <Input
                                id="height"
                                name="height"
                                type="number"
                                step="1"
                                defaultValue={athlete.height || ''}
                                placeholder="175"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input
                                id="dob"
                                name="dob"
                                type="date"
                                defaultValue={athlete.dob || ''}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                name="address"
                                type="text"
                                defaultValue={athlete.address || ''}
                                placeholder="City, Country"
                            />
                        </div>

                        <Button type="submit" className="w-full">Save Changes</Button>
                    </form>
                </div>

                {/* Body Composition Card */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="h-5 w-5" />
                        <h2 className="text-xl font-semibold">Body Composition</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="text-sm text-muted-foreground">BMI</div>
                            <div className="text-2xl font-bold">
                                {athlete.bmi || '-'}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-muted-foreground">Somatotype</div>
                            <div className="text-2xl font-bold">
                                {athlete.somatotype || 'Unknown'}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-muted-foreground">Profilo Ciclistico</div>
                            <div className="text-2xl font-bold">
                                {athlete.riderProfile
                                    ? athlete.riderProfile === 'SPRINTER' ? 'Sprinter'
                                        : athlete.riderProfile === 'CLIMBER' ? 'Scalatore'
                                            : athlete.riderProfile === 'ALL_ROUNDER' ? 'Completo'
                                                : 'Cronoman'
                                    : 'Da determinare'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced Metrics Card */}
                <div className="rounded-xl border border-border bg-card p-6 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5" />
                        <h2 className="text-xl font-semibold">Advanced Physiology</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        <div>
                            <div className="text-sm text-muted-foreground">VLAmax</div>
                            <div className="text-2xl font-bold">
                                {athlete.vlamax ? `${athlete.vlamax} mmol/L/s` : '-'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Maximal glycolytic rate
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-muted-foreground">APR</div>
                            <div className="text-2xl font-bold">
                                {athlete.apr ? `${athlete.apr}W` : '-'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Anaerobic Power Reserve
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-muted-foreground">W/kg</div>
                            <div className="text-2xl font-bold">
                                {athlete.ftp && athlete.weight
                                    ? `${(athlete.ftp / athlete.weight).toFixed(2)}`
                                    : '-'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Power-to-weight ratio
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
