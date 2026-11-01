import {getGenreCsvEntries} from '@/lib/data/csv-loader'

export type GenreLink = {
    name: string
    wikiID?: string
    path: string
}

export async function getGenreLinks(): Promise<Record<string, GenreLink>> {
    const entries = await getGenreCsvEntries()
    return Object.fromEntries(entries.map(entry => {
        const category = entry.inCategory || 'Other'
        const segments = entry.typeOf ? [category, entry.typeOf, entry.name] : [category, entry.name]
        const path = `/genres/category/${segments.map(segment => encodeURIComponent(segment)).join('/')}`
        return [entry.name.trim().normalize('NFC'), {name: entry.name, wikiID: entry.wikiQID || undefined, path}]
    }))
}
