'use client'

import {createContext, useContext, type ReactNode} from 'react'
import type {GenreLink} from '@/lib/data/genre-links'
import {createGenreTermLocalizer, genreTermKey} from '@/lib/i18n/genre-term'
import type {Locale} from '@/lib/i18n/config'

const GenreLinkContext = createContext<Record<string, GenreLink>>({})

export function GenreLinkProvider({value, children}: {value: Record<string, GenreLink>; children: ReactNode}) {
    return <GenreLinkContext.Provider value={value}>{children}</GenreLinkContext.Provider>
}

export function useGenreLink(term: string): GenreLink | undefined {
    return useContext(GenreLinkContext)[genreTermKey(term)]
}

export function useGenreTermLocalizer(locale: Locale) {
    return createGenreTermLocalizer(useContext(GenreLinkContext), locale)
}
