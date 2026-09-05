import 'server-only'

import {getDatabase} from './sqlite'

export type Catalogue = {
    catalogueId: number
    code: string
    name: string | null
    workCount: number
}

/** A catalogue reference owned by a single Work (read-only view of works.catalog_no). */
export type CatalogueEntry = {
    entryId: number
    catalogueCode: string
    entryNo: string
    workId: number
    workTitle: string | null
}

/**
 * Read-side data layer for the catalogue subsystem.
 *
 * `catalogue_entries` is the authority for which catalogue reference a Work carries.
 * works.catalog_no is the legacy single-string field preserved for display/compat and
 * was used to populate catalogue_entries; do not write it directly.
 */
export function getCatalogues(): Catalogue[] {
    const db = getDatabase()
    try {
        return db.prepare(`
      SELECT c.catalogue_id AS catalogueId, c.code, c.name,
             COUNT(ce.entry_id) AS workCount
      FROM catalogues c
      LEFT JOIN catalogue_entries ce ON ce.catalogue_id = c.catalogue_id
      GROUP BY c.catalogue_id
      ORDER BY c.code
    `).all() as Catalogue[]
    } finally {
        db.close()
    }
}

export function getEntriesByCatalogue(code: string): CatalogueEntry[] {
    const db = getDatabase()
    try {
        return db.prepare(`
      SELECT ce.entry_id AS entryId, c.code AS catalogueCode, ce.entry_no AS entryNo,
             ce.work_id AS workId, w.title AS workTitle
      FROM catalogue_entries ce
      JOIN catalogues c ON c.catalogue_id = ce.catalogue_id
      LEFT JOIN works w ON w.work_id = ce.work_id
      WHERE c.code = @code
      ORDER BY CAST(ce.entry_no AS INTEGER), ce.entry_no
    `).all({code}) as CatalogueEntry[]
    } finally {
        db.close()
    }
}

export function getCatalogueEntriesForWork(workId: number): CatalogueEntry[] {
    const db = getDatabase()
    try {
        return db.prepare(`
      SELECT ce.entry_id AS entryId, c.code AS catalogueCode, ce.entry_no AS entryNo,
             ce.work_id AS workId, w.title AS workTitle
      FROM catalogue_entries ce
      JOIN catalogues c ON c.catalogue_id = ce.catalogue_id
      LEFT JOIN works w ON w.work_id = ce.work_id
      WHERE ce.work_id = @workId
      ORDER BY c.code
    `).all({workId}) as CatalogueEntry[]
    } finally {
        db.close()
    }
}
