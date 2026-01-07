'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            toast({
                variant: "destructive",
                title: "Login fallito",
                description: error.message,
            })
            setLoading(false)
        } else {
            toast({
                title: "Login effettuato",
                description: "Reindirizzamento in corso...",
            })
            router.refresh()

            // Check role and redirect
            const role = data.user?.user_metadata?.role
            if (role === 'coach') {
                router.push('/coach')
            } else if (role === 'athlete') {
                router.push('/athlete')
            } else {
                router.push('/')
            }
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Accedi</CardTitle>
                    <CardDescription>Inserisci le tue credenziali per accedere alla piattaforma.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nome@esempio.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Accesso in corso...' : 'Accedi'}
                        </Button>
                        <div className="text-center text-sm">
                            Non hai un account?{' '}
                            <Link href="/sign-up" className="underline">
                                Registrati
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
