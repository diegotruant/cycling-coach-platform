import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Check if the request is for the athlete section
    if (request.nextUrl.pathname.startsWith('/athlete')) {
        // Allow access to login page
        if (request.nextUrl.pathname === '/athlete/login') {
            return NextResponse.next();
        }

        // Check for session cookie
        const session = request.cookies.get('athlete_session');

        if (!session) {
            return NextResponse.redirect(new URL('/athlete/login', request.url));
        }
    }

    // Set pathname header for access in Server Components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', request.nextUrl.pathname);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: '/athlete/:path*',
};
