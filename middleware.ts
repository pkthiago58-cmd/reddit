
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiting (for demonstration/single instance)
// In production with multiple instances, use Redis/Memcached
const rateLimit = new Map<string, { count: number, lastReset: number }>();
const WINDOW_SIZE = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

export function middleware(request: NextRequest) {
    const response = NextResponse.next()

    // 1. Security Headers
    response.headers.set('X-DNS-Prefetch-Control', 'on')
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin')

    // Content Security Policy (CSP) - Basic permissive policy for now to avoid breaking external resources
    // In a strict environment, you'd list all allowed domains
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:; connect-src 'self' https:;"
    )

    // 2. Rate Limiting (Skip for static assets)
    if (!request.nextUrl.pathname.startsWith('/_next') && !request.nextUrl.pathname.startsWith('/static')) {
        // Fix: Cast to any to access ip or use headers
        const ip = (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
        const now = Date.now();
        const record = rateLimit.get(ip) || { count: 0, lastReset: now };

        if (now - record.lastReset > WINDOW_SIZE) {
            record.count = 0;
            record.lastReset = now;
        }

        record.count++;
        rateLimit.set(ip, record);

        if (record.count > MAX_REQUESTS) {
            return new NextResponse('Too Many Requests', { status: 429 });
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
