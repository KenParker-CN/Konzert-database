'use client'

import { useParams } from 'next/navigation'
import { defaultLocale, isLocale } from './config'
import { getDictionary } from './dictionaries'
import { makeTranslator } from './core'

/**
 * Client-side i18n accessor. Usage in a client component:
 *
 *   const { t, locale } = useI18n()
 *
 * The locale is read straight from the `[locale]` route segment via
 * `useParams()` — no provider or context needed.
 */
export function useI18n() {
    const params = useParams<{ locale?: string }>()
    const locale = isLocale(params?.locale) ? params.locale : defaultLocale

    return {
        locale,
        t: makeTranslator(getDictionary(locale)),
    }
}