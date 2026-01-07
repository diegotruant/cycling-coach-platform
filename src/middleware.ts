import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // Auth Guard
    if (!user && (path.startsWith('/coach') || path.startsWith('/athlete'))) {
        // Allow login pages
        if (!path.includes('/login') && !path.includes('/sign-up')) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // Role Based Access Control
    if (user) {
        const role = user.user_metadata?.role

        // Redirect from login/signup if already logged in
        if (path === '/login' || path === '/sign-up') {
            if (role === 'coach') {
                return NextResponse.redirect(new URL('/coach', request.url))
            } else {
                return NextResponse.redirect(new URL('/athlete', request.url))
            }
        }

        // Protect Coach Routes
        if (path.startsWith('/coach')) {
            if (role !== 'coach') {
                // Redirect to athlete dashboard or unauthorized page
                return NextResponse.redirect(new URL('/athlete', request.url))
            }
        }

        // Protect Athlete Routes
        if (path.startsWith('/athlete')) {
            if (role !== 'athlete') {
                // Redirect to coach dashboard or unauthorized page
                return NextResponse.redirect(new URL('/coach', request.url))
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
