import 'server-only'

export type Catalogue = {
    catalogueId: number
    code: string
    name: string | null
    workCount: number
}

export type CatalogueEntry = {
    entryId: number
    catalogueCode: string
    entryNo: string
    workId: number
    workTitle: string | null
}

export async function getCatalogues(): Promise<Catalogue[]> {
    return []
}

export async function getEntriesByCatalogue(code: string): Promise<CatalogueEntry[]> {
    return []
}

export async function getCatalogueEntriesForWork(workId: number): Promise<CatalogueEntry[]> {
    return []
}
