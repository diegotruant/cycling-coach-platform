"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function SplashScreen({ onFinish }: { onFinish?: () => void }) {
    const [isVisible, setIsVisible] = useState(true);
    const [rotation, setRotation] = useState(0);
    const [opacity, setOpacity] = useState(1);

    useEffect(() => {
        // Start rotation immediately after mount
        // We use a small timeout to ensure the initial state (0deg) is rendered first
        const spinTimer = setTimeout(() => {
            setRotation(1080); // Spin 3 times (360 * 3)
        }, 100);

        // Fade out and finish after rotation is done (3s duration)
        const exitTimer = setTimeout(() => {
            setOpacity(0);
        }, 3100); // Wait slightly longer than the spin duration

        const cleanupTimer = setTimeout(() => {
            setIsVisible(false);
            if (onFinish) onFinish();
        }, 3600); // Allow 500ms for fade out

        return () => {
            clearTimeout(spinTimer);
            clearTimeout(exitTimer);
            clearTimeout(cleanupTimer);
        };
    }, [onFinish]);

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500",
                opacity === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
        >
            <div className="relative flex flex-col items-center justify-center">
                <div
                    className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-primary shadow-2xl"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: "transform 3s cubic-bezier(0.1, 0.7, 0.1, 1)", // Custom ease-out for "wheel slowing down" feel
                    }}
                >
                    <Image
                        src="/logo.jpg"
                        alt="DD Training Logo"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
                <h1
                    className={cn(
                        "mt-8 text-4xl font-bold tracking-tighter text-foreground transition-all duration-1000 delay-500",
                        opacity === 1 ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                    )}
                >
                    DD Training
                </h1>
            </div>
        </div>
    );
}
