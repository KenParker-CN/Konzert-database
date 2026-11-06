import {getGenreCsvEntries} from '@/lib/data/csv-loader'
import {getGenrePath} from '@/lib/data/genre-v2'
import {genreTermKey} from '@/lib/i18n/genre-term'

export type GenreLink = {
    name: string
    nameZh: string
    wikiID?: string
    path: string
}

export async function getGenreLinks(): Promise<Record<string, GenreLink>> {
    const entries = await getGenreCsvEntries()
    return Object.fromEntries(entries.map(entry => {
        const path = getGenrePath(entry)
        return [genreTermKey(entry.name), {name: entry.name, nameZh: entry.nameZh, wikiID: entry.wikiQID || undefined, path}]
    }))
}
