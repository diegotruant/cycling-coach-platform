'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AthleteConfig } from "@/lib/storage";
import { Bike, Zap, Heart, TrendingUp, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
    assignments: AthleteConfig['assignments'];
}

function getActivityIcon(workoutName: string) {
    const name = workoutName.toLowerCase();
    if (name.includes('recovery')) return <Heart className="h-4 w-4 text-green-600" />;
    if (name.includes('vo2') || name.includes('intervals')) return <Zap className="h-4 w-4 text-orange-600" />;
    if (name.includes('race')) return <TrendingUp className="h-4 w-4 text-red-600" />;
    return <Bike className="h-4 w-4 text-blue-600" />;
}

function getTSSBadgeVariant(tss: number): "default" | "secondary" | "destructive" | "outline" {
    if (tss < 50) return "secondary";
    if (tss < 100) return "default";
    if (tss < 150) return "outline";
    return "destructive";
}

export function ActivityFeed({ assignments }: ActivityFeedProps) {
    // Filter for completed activities with data
    const activities = (assignments || [])
        .filter(a => a.status === 'COMPLETED' && a.activityData)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10); // Show last 10

    if (activities.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>Your latest completed workouts</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                    No completed activities found.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Your latest completed workouts</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Activity</TableHead>
                            <TableHead className="text-right">TSS</TableHead>
                            <TableHead className="text-right">NP</TableHead>
                            <TableHead className="text-right">Distance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activities.map((activity, index) => (
                            <TableRow
                                key={activity.id}
                                className={cn(index % 2 === 0 ? "bg-muted/30" : "")}
                            >
                                <TableCell className="font-medium text-sm">
                                    {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {getActivityIcon(activity.workoutName)}
                                        <div>
                                            <div className="font-medium text-sm">{activity.workoutName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {activity.activityData?.duration
                                                    ? `${Math.floor(activity.activityData.duration / 3600)}h ${Math.floor((activity.activityData.duration % 3600) / 60)}m`
                                                    : '-'}
                                                {activity.activityData?.elevationGain && (
                                                    <span className="ml-2 inline-flex items-center gap-1">
                                                        <Mountain className="h-3 w-3" />
                                                        {activity.activityData.elevationGain}m
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={getTSSBadgeVariant(activity.activityData?.tss || 0)}>
                                        {activity.activityData?.tss || '-'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                    {activity.activityData?.np || '-'}W
                                </TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">
                                    {activity.activityData?.distance
                                        ? `${(activity.activityData.distance / 1000).toFixed(1)}km`
                                        : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
