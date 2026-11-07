import type {ComposerAliases} from '@/lib/db/composers'
import type {Locale} from '@/lib/i18n/config'

export function getLocalizedComposerName(name: string, aliases: ComposerAliases, locale: Locale): string {
    return aliases[locale].trim() || name
}
