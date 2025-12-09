'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Notifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Poll for notifications (mock for now)
        // In production, use WebSockets or Server-Sent Events
        const checkNotifications = async () => {
            try {
                const response = await fetch('/api/athlete/notifications');
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data.notifications);
                    setUnreadCount(data.unreadCount);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };

        checkNotifications();
        const interval = setInterval(checkNotifications, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifiche</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        Nessuna nuova notifica
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                            <span className="font-medium">{notification.title}</span>
                            <span className="text-xs text-muted-foreground mt-1">
                                {notification.message}
                            </span>
                            <span className="text-xs text-muted-foreground mt-2 w-full text-right">
                                {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
