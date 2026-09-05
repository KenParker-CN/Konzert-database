export const locales = ['en', 'zh', 'fr', 'de', 'ja'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export function isLocale(value: string | undefined | null): value is Locale {
    return !!value && (locales as readonly string[]).includes(value)
}

/**
 * Build a locale-aware path from an app path.
 *   localePath('zh', '/works') => '/zh/works'
 *   localePath('fr')           => '/fr'
 */
export function localePath(locale: Locale, path: string = '/'): string {
    if (path === '/' || path === '') return `/${locale}`
    return `/${locale}${path.startsWith('/') ? path : `/${path}`}`
}