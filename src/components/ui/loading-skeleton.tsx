import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
    variant?: 'card' | 'table' | 'chart' | 'list' | 'stat';
    count?: number;
    className?: string;
}

export function LoadingSkeleton({ variant = 'card', count = 1, className }: LoadingSkeletonProps) {
    const skeletons = Array.from({ length: count }, (_, i) => i);

    if (variant === 'card') {
        return (
            <div className={cn("space-y-4", className)}>
                {skeletons.map((i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </div>
                        <Skeleton className="h-8 w-20 mb-2" />
                        <Skeleton className="h-3 w-40" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'stat') {
        return (
            <div className={cn("grid gap-4 md:grid-cols-4", className)}>
                {skeletons.map((i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </div>
                        <Skeleton className="h-8 w-16 mb-1" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'table') {
        return (
            <div className={cn("space-y-3", className)}>
                <div className="flex gap-4 pb-2 border-b">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                </div>
                {skeletons.map((i) => (
                    <div key={i} className="flex gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'chart') {
        return (
            <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
                <Skeleton className="h-5 w-40 mb-4" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        );
    }

    if (variant === 'list') {
        return (
            <div className={cn("space-y-3", className)}>
                {skeletons.map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-3 w-16" />
                    </div>
                ))}
            </div>
        );
    }

    return null;
}
