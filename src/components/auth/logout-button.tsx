'use client'

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function LogoutButton({ children, className }: { children?: React.ReactNode, className?: string }) {
    const router = useRouter()

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    return (
        <Button onClick={handleLogout} variant="outline" className={className}>
            {children || "Esci"}
        </Button>
    )
}
