import 'server-only'

import { getDatabase } from './sqlite'

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
    const db = getDatabase()
    const result = await db.execute(`
      SELECT c.catalogue_id AS catalogueId, c.code, c.name,
             COUNT(ce.entry_id) AS workCount
      FROM catalogues c
      LEFT JOIN catalogue_entries ce ON ce.catalogue_id = c.catalogue_id
      GROUP BY c.catalogue_id
      ORDER BY c.code
    `)
    return result.rows as unknown as Catalogue[]
}

export async function getEntriesByCatalogue(code: string): Promise<CatalogueEntry[]> {
    const db = getDatabase()
    const result = await db.execute({
        sql: `
      SELECT ce.entry_id AS entryId, c.code AS catalogueCode, ce.entry_no AS entryNo,
             ce.work_id AS workId, w.title AS workTitle
      FROM catalogue_entries ce
      JOIN catalogues c ON c.catalogue_id = ce.catalogue_id
      LEFT JOIN works w ON w.work_id = ce.work_id
      WHERE c.code = @code
      ORDER BY CAST(ce.entry_no AS INTEGER), ce.entry_no
    `,
        args: { code },
    })
    return result.rows as unknown as CatalogueEntry[]
}

export async function getCatalogueEntriesForWork(workId: number): Promise<CatalogueEntry[]> {
    const db = getDatabase()
    const result = await db.execute({
        sql: `
      SELECT ce.entry_id AS entryId, c.code AS catalogueCode, ce.entry_no AS entryNo,
             ce.work_id AS workId, w.title AS workTitle
      FROM catalogue_entries ce
      JOIN catalogues c ON c.catalogue_id = ce.catalogue_id
      LEFT JOIN works w ON w.work_id = ce.work_id
      WHERE ce.work_id = @workId
      ORDER BY c.code
    `,
        args: { workId },
    })
    return result.rows as unknown as CatalogueEntry[]
}
