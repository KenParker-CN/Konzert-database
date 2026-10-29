import type { Locale } from './config'
import type { Messages } from './core'

import en from '../../messages/en.json'
import zh from '../../messages/zh.json'
import fr from '../../messages/fr.json'
import de from '../../messages/de.json'

export const dictionaries: Record<Locale, Messages> = {
    en,
    zh,
    fr,
    de,
}

export function getDictionary(locale: Locale): Messages {
    return dictionaries[locale]
}