import type {Locale} from '@/lib/i18n/config'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'

export type GenreNameLinks = Record<string, {nameZh: string}>

export function genreTermKey(term: string) {
    return term.trim().normalize('NFC').toLocaleLowerCase('en')
}

export function localizeGenreTerm(term: string, locale: Locale, nameZh: string | undefined): string {
    if (locale === 'zh' && nameZh) return nameZh
    return getLocalizedWorkTerm(term, 'type', locale)
}

export function createGenreTermLocalizer(links: GenreNameLinks, locale: Locale) {
    return (term: string) => localizeGenreTerm(term, locale, links[genreTermKey(term)]?.nameZh)
}
