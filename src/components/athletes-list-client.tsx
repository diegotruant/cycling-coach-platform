'use client';

import { useState } from 'react';
import { AthleteWithStatus } from '@/app/actions/coach-actions';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AthleteStatusCard from '@/components/athlete-status-card';

interface AthletesListClientProps {
    athletes: AthleteWithStatus[];
}

type SortField = 'name' | 'hrv' | 'lastActivity' | 'ftp';
type FilterStatus = 'ALL' | 'GREEN' | 'YELLOW' | 'RED' | 'NFOR';

export default function AthletesListClient({ athletes }: AthletesListClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

    // Filter athletes
    const filteredAthletes = athletes.filter(athlete => {
        // Search filter
        const matchesSearch = athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            athlete.email.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        // Status filter
        if (filterStatus === 'ALL') return true;
        if (filterStatus === 'NFOR') return athlete.overreachingStatus === 'NFOR';
        return athlete.hrvStatus === filterStatus;
    });

    // Sort athletes
    filteredAthletes.sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'hrv':
                comparison = (a.currentHRV || 0) - (b.currentHRV || 0);
                break;
            case 'lastActivity':
                comparison = (a.lastActivity || '').localeCompare(b.lastActivity || '');
                break;
            case 'ftp':
                comparison = (a.ftp || 0) - (b.ftp || 0);
                break;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca per nome o email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2 flex-wrap">
                    {(['ALL', 'NFOR', 'RED', 'YELLOW', 'GREEN'] as FilterStatus[]).map(status => (
                        <Button
                            key={status}
                            variant={filterStatus === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterStatus(status)}
                            className={
                                status === 'NFOR' ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white' :
                                    status === 'RED' ? 'border-red-500/50' :
                                        status === 'YELLOW' ? 'border-orange-500/50' :
                                            status === 'GREEN' ? 'border-green-500/50' : ''
                            }
                        >
                            {status === 'NFOR' && '🔴 '}
                            {status === 'RED' && '🔴 '}
                            {status === 'YELLOW' && '🟠 '}
                            {status === 'GREEN' && '🟢 '}
                            {status}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Sort Controls */}
            <div className="flex gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground self-center">Ordina per:</span>
                {([
                    { field: 'name' as SortField, label: 'Nome' },
                    { field: 'hrv' as SortField, label: 'HRV' },
                    { field: 'ftp' as SortField, label: 'FTP' },
                    { field: 'lastActivity' as SortField, label: 'Ultima Attività' },
                ]).map(({ field, label }) => (
                    <Button
                        key={field}
                        variant={sortField === field ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => toggleSort(field)}
                    >
                        {label}
                        {sortField === field && (
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                        )}
                    </Button>
                ))}
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
                {filteredAthletes.length} atleti trovati
            </p>

            {/* Athletes Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAthletes.map(athlete => (
                    <AthleteStatusCard key={athlete.id} athlete={athlete} />
                ))}
            </div>

            {filteredAthletes.length === 0 && (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                    <Filter className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">Nessun atleta corrisponde ai filtri selezionati</p>
                </div>
            )}
        </div>
    );
}
