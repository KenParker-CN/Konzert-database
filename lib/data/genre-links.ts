import {getGenreCsvEntries} from '@/lib/data/csv-loader'
import {getGenrePath} from '@/lib/data/genre-v2'

export type GenreLink = {
    name: string
    wikiID?: string
    path: string
}

export async function getGenreLinks(): Promise<Record<string, GenreLink>> {
    const entries = await getGenreCsvEntries()
    return Object.fromEntries(entries.map(entry => {
        const path = getGenrePath(entry)
        return [entry.name.trim().normalize('NFC'), {name: entry.name, wikiID: entry.wikiQID || undefined, path}]
    }))
}
