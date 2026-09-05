import { NextResponse, type NextRequest } from 'next/server'
import { defaultLocale, isLocale } from './lib/i18n/config'

/**
 * Locale proxy (Next.js 16 middleware replacement).
 *
 * - `/`                 → `/{defaultLocale}` (default `/en`)
 * - `/works`            → `/{defaultLocale}/works`
 * - `/xx/...` (invalid
 *   two-letter locale)  → `/{defaultLocale}/...`
 * - `/en/works` (valid) → pass through
 *
 * `/api`, `/_next`, `/_vercel` and static assets are left untouched.
 */
export function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl
    const segments = pathname.split('/').filter(Boolean)
    const first = segments[0]

    // `/` → `/{defaultLocale}`
    if (pathname === '/' || pathname === '') {
        return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url))
    }

    // Non-localized app routes (e.g. `/admin`) are handled by the app directly.
    if (first === 'admin') {
        // Admin auth check
        const adminAuth = request.cookies.get('admin_auth')?.value
        if (pathname !== '/admin/login' && adminAuth !== 'true') {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
        return NextResponse.next()
    }

    // Already localized — let the app handle it.
    if (first && isLocale(first)) {
        return NextResponse.next()
    }

    // Looks like an invalid locale, e.g. `/xx/works` — normalize to the default locale.
    if (first && /^[a-z]{2}$/i.test(first)) {
        const remainder = segments.slice(1).join('/')
        return NextResponse.redirect(
            new URL(`/${defaultLocale}${remainder ? `/${remainder}` : ''}${search}`, request.url),
        )
    }

    // Unprefixed app path such as `/works` → `/{defaultLocale}/works`.
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}${search}`, request.url))
}

export const config = {
    matcher: [
        '/((?!api|_next|_vercel|.*\\..*).*)',
    ],
}