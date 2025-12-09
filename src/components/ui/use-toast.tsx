"use client"

import * as React from "react"


// Simplified version of use-toast for now to avoid full Shadcn dependency if not needed
// Or I can implement the full one. Let's implement a simple one first.

const ToastContext = React.createContext<{
    toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" }) => void
}>({
    toast: () => { },
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<any[]>([])

    const toast = React.useCallback(({ title, description, variant }: any) => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts((prev) => [...prev, { id, title, description, variant }])
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3000)
    }, [])

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`rounded-md border p-4 shadow-md w-[350px] ${t.variant === "destructive"
                            ? "bg-destructive text-destructive-foreground border-destructive"
                            : "bg-background border-border"
                            }`}
                    >
                        {t.title && <div className="font-semibold">{t.title}</div>}
                        {t.description && <div className="text-sm opacity-90">{t.description}</div>}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    return React.useContext(ToastContext)
}
