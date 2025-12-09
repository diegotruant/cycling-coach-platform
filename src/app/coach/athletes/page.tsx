import { getAthletesWithStatus } from '@/app/actions/coach-actions';
import AthletesListClient from '@/components/athletes-list-client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { AddAthleteDialog } from '@/components/add-athlete-dialog';

export default async function AthletesListPage() {
    const athletes = await getAthletesWithStatus();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/coach">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Dashboard
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tutti gli Atleti</h1>
                        <p className="text-muted-foreground mt-1">
                            Vista completa con filtri e ricerca
                        </p>
                    </div>
                </div>
                <AddAthleteDialog />
            </div>

            <AthletesListClient athletes={athletes} />
        </div>
    );
}
