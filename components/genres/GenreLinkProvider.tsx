'use client'

import {createContext, useContext, type ReactNode} from 'react'
import type {GenreLink} from '@/lib/data/genre-links'

const GenreLinkContext = createContext<Record<string, GenreLink>>({})

export function GenreLinkProvider({value, children}: {value: Record<string, GenreLink>; children: ReactNode}) {
    return <GenreLinkContext.Provider value={value}>{children}</GenreLinkContext.Provider>
}

export function useGenreLink(term: string): GenreLink | undefined {
    return useContext(GenreLinkContext)[term.trim().normalize('NFC')]
}
