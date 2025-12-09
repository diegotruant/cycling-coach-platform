'use client';

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ReactNode } from "react";

interface CoachStatsCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: ReactNode;
    trend?: {
        value: number;
        label: string;
    };
    variant?: 'default' | 'success' | 'warning' | 'danger';
    onClick?: () => void;
}

const variantStyles = {
    default: {
        border: 'border-border',
        bg: 'bg-card',
        icon: 'text-primary',
        value: 'text-foreground'
    },
    success: {
        border: 'border-green-500/30',
        bg: 'bg-green-500/5',
        icon: 'text-green-500',
        value: 'text-green-500'
    },
    warning: {
        border: 'border-orange-500/30',
        bg: 'bg-orange-500/5',
        icon: 'text-orange-500',
        value: 'text-orange-500'
    },
    danger: {
        border: 'border-red-500/30',
        bg: 'bg-red-500/5',
        icon: 'text-red-500',
        value: 'text-red-500'
    }
};

export function CoachStatsCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    variant = 'default',
    onClick
}: CoachStatsCardProps) {
    const styles = variantStyles[variant];

    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend.value > 0) return <TrendingUp className="h-3 w-3" />;
        if (trend.value < 0) return <TrendingDown className="h-3 w-3" />;
        return <Minus className="h-3 w-3" />;
    };

    const getTrendColor = () => {
        if (!trend) return '';
        if (trend.value > 0) return 'text-green-600';
        if (trend.value < 0) return 'text-red-600';
        return 'text-muted-foreground';
    };

    return (
        <Card
            className={cn(
                "rounded-xl border shadow-sm transition-all",
                styles.border,
                styles.bg,
                onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02]"
            )}
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                    <div className={cn("flex items-center justify-center", styles.icon)}>
                        {icon}
                    </div>
                </div>

                <div className="space-y-1">
                    <div className={cn("text-2xl font-bold", styles.value)}>
                        {value}
                    </div>

                    {subtitle && (
                        <p className="text-xs text-muted-foreground">
                            {subtitle}
                        </p>
                    )}

                    {trend && (
                        <div className={cn("flex items-center gap-1 text-xs font-medium", getTrendColor())}>
                            {getTrendIcon()}
                            <span>{Math.abs(trend.value)}%</span>
                            <span className="text-muted-foreground font-normal">{trend.label}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
