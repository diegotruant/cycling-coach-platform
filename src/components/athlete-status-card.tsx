import Link from 'next/link';
import { AthleteWithStatus } from '@/app/actions/coach-actions';
import { Heart, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface AthleteStatusCardProps {
    athlete: AthleteWithStatus;
}

export default function AthleteStatusCard({ athlete }: AthleteStatusCardProps) {
    const getHRVBadge = () => {
        if (athlete.overreachingStatus === 'NFOR') {
            return (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    NFOR
                </div>
            );
        }

        if (athlete.hrvStatus === 'RED') {
            return <div className="w-4 h-4 rounded-full bg-red-500" title="RED - Recupero necessario" />;
        }
        if (athlete.hrvStatus === 'YELLOW') {
            return <div className="w-4 h-4 rounded-full bg-orange-500" title="YELLOW - Modula carico" />;
        }
        if (athlete.hrvStatus === 'GREEN') {
            return <div className="w-4 h-4 rounded-full bg-green-500" title="GREEN - Pronto" />;
        }
        return <div className="w-4 h-4 rounded-full bg-gray-400" title="No data" />;
    };

    const getTrendIcon = () => {
        if (!athlete.hrvDeviation) return <Minus className="h-4 w-4 text-gray-400" />;
        if (athlete.hrvDeviation > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (athlete.hrvDeviation < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-gray-400" />;
    };

    return (
        <div className={`relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md ${athlete.overreachingStatus === 'NFOR' || athlete.hrvStatus === 'RED'
                ? 'border-red-500/30 bg-red-500/5'
                : athlete.hrvStatus === 'YELLOW'
                    ? 'border-orange-500/20'
                    : 'border-border'
            }`}>
            {/* NFOR Badge */}
            {athlete.overreachingStatus === 'NFOR' && getHRVBadge()}

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                            {athlete.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        {athlete.overreachingStatus !== 'NFOR' && (
                            <div className="absolute -bottom-1 -right-1">
                                {getHRVBadge()}
                            </div>
                        )}
                    </div>

                    {/* Name & Email */}
                    <div>
                        <h3 className="font-semibold text-lg">{athlete.name}</h3>
                        <p className="text-xs text-muted-foreground">{athlete.email}</p>
                    </div>
                </div>
            </div>

            {/* HRV Status */}
            {athlete.currentHRV && (
                <div className="mb-4 p-3 rounded-lg bg-background">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">HRV</span>
                        </div>
                        {getTrendIcon()}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{athlete.currentHRV}</span>
                        <span className="text-sm text-muted-foreground">ms</span>
                        {athlete.hrvDeviation !== undefined && (
                            <span className={`text-sm font-semibold ${athlete.hrvDeviation > 0 ? 'text-green-500' :
                                    athlete.hrvDeviation < 0 ? 'text-red-500' :
                                        'text-gray-500'
                                }`}>
                                {athlete.hrvDeviation > 0 ? '+' : ''}{athlete.hrvDeviation}%
                            </span>
                        )}
                    </div>
                    {athlete.baselineHRV && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Baseline: {athlete.baselineHRV.toFixed(1)}ms
                        </p>
                    )}
                </div>
            )}

            {!athlete.currentHRV && (
                <div className="mb-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-xs text-orange-600 font-medium">⚠️ Nessun dato HRV recente</p>
                </div>
            )}

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="text-center p-2 rounded bg-background">
                    <p className="text-xs text-muted-foreground">FTP</p>
                    <p className="text-lg font-bold">{athlete.ftp || '-'}<span className="text-xs font-normal">W</span></p>
                </div>
                <div className="text-center p-2 rounded bg-background">
                    <p className="text-xs text-muted-foreground">CP</p>
                    <p className="text-lg font-bold">{athlete.cp || '-'}<span className="text-xs font-normal">W</span></p>
                </div>
            </div>

            {/* Last Activity */}
            <div className="text-xs text-muted-foreground mb-4">
                <p>Ultimo HRV: {athlete.lastHRVDate ? new Date(athlete.lastHRVDate).toLocaleDateString() : 'N/D'}</p>
                <p>Ultimo test: {athlete.lastTestDate ? new Date(athlete.lastTestDate).toLocaleDateString() : 'N/D'}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Link href={`/coach/athletes/${athlete.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                        Profilo
                    </Button>
                </Link>
                <Link href={`/coach/athletes/${athlete.id}#recovery`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full">
                        Recovery
                    </Button>
                </Link>
            </div>
        </div>
    );
}
