import type {ComposerAliases} from '@/lib/db/composers'
import type {Locale} from '@/lib/i18n/config'

export function getLocalizedComposerName(name: string, aliases: ComposerAliases, locale: Locale): string {
    return aliases[locale].trim() || name
}

export function getCountryFlagCode(code: string): string {
    const normalizedCode = code.trim().toUpperCase() === 'UK' ? 'GB' : code.trim().toUpperCase()
    if (!/^[A-Z]{2}$/.test(normalizedCode)) return ''

    return normalizedCode.toLowerCase()
}
