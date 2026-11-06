import type {GenreCsvEntry} from '@/lib/data/csv-loader'

export function getGenreV2Slug(name: string) {
    return name
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLocaleLowerCase('en')
        .replace(/\s+/g, '-')
}

export function getGenrePath(entry: GenreCsvEntry) {
    return `/genres/${entry.segments.map(encodeURIComponent).join('/')}`
}

export function getGenreChildren(entries: GenreCsvEntry[], parent: GenreCsvEntry) {
    return entries.filter(entry => entry.typeOf === parent.name)
}

export function getGenreAncestors(entries: GenreCsvEntry[], entry: GenreCsvEntry) {
    const ancestors: GenreCsvEntry[] = []
    let parent = entries.find(candidate => candidate.name === entry.typeOf)
    while (parent) {
        ancestors.unshift(parent)
        const current = parent
        parent = entries.find(candidate => candidate.name === current.typeOf)
    }
    return ancestors
}
