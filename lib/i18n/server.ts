import type { Locale } from './config'
import { getDictionary } from './dictionaries'
import { makeTranslator } from './core'

/**
 * Server-side i18n accessor. Usage in a server component:
 *
 *   const { t, locale } = await getI18n(locale)
 */
export async function getI18n(locale: Locale) {
    return {
        locale,
        t: makeTranslator(getDictionary(locale)),
    }
}