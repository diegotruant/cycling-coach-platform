import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAthleteRoute = createRouteMatcher(['/athlete(.*)']);
const isCoachRoute = createRouteMatcher(['/coach(.*)']);

export default clerkMiddleware(async (auth, req) => {
    // If it's an athlete route and the user is not signed in
    if (isAthleteRoute(req) && !req.nextUrl.pathname.includes('/login')) {
        await auth.protect({
            unauthenticatedUrl: new URL(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/athlete/login', req.url).toString(),
        });
    }

    // If it's a coach route and the user is not signed in
    if (isCoachRoute(req) && !req.nextUrl.pathname.includes('/login')) {
        await auth.protect({
            unauthenticatedUrl: new URL('/coach/login', req.url).toString(),
        });
    }

    // Restore x-pathname header for access in Server Components
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-pathname', req.nextUrl.pathname);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
