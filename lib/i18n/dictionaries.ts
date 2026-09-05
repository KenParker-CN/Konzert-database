import type { Locale } from './config'
import type { Messages } from './core'

import en from '../../messages/en.json'
import zh from '../../messages/zh.json'
import fr from '../../messages/fr.json'
import de from '../../messages/de.json'
import ja from '../../messages/ja.json'

export const dictionaries: Record<Locale, Messages> = {
    en,
    zh,
    fr,
    de,
    ja,
}

export function getDictionary(locale: Locale): Messages {
    return dictionaries[locale]
}