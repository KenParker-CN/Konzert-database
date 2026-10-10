import 'server-only'

import {Pool} from 'pg'

export type DatabaseCatalogueWork = {
    workId: number
    catalogue: string
    opus: string
    secondaryCatalogue: string
    date: string
    title: string
    type: string
    key: string
    instrumentation: string
    details: Record<string, string>
}

export type DatabaseCatalogueInfo = {
    name: string
    abbreviation: string
    type: string | null
    composerName: string | null
}

const globalForPostgres = globalThis as typeof globalThis & {
    postgresPool?: Pool
}

function getPool() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required to read catalogue data from PostgreSQL')
    }

    globalForPostgres.postgresPool ??= new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
    })

    return globalForPostgres.postgresPool
}

export async function getPostgresCatalogueInfo(catalogueCode: string): Promise<DatabaseCatalogueInfo | null> {
    const result = await getPool().query<DatabaseCatalogueInfo>(
        `select c.cata_name as name,
                c.cata_abbr as abbreviation,
                c.cata_type as type,
                composer.name as "composerName"
         from catalogues c
         left join composers composer on composer.id = c.composer_id
         where c.cata_abbr = $1
         limit 1`,
        [catalogueCode],
    )

    return result.rows[0] ?? null
}

export async function getPostgresCatalogueWorkCount(catalogueCode: string): Promise<number> {
    const result = await getPool().query<{count: number}>(
        `select count(*)::int as count
         from (
             select distinct ce.catalogue_number, ce.opus, ce.date,
                    w.title, w.type, w.tonality, w.instr, w.note
             from catalogue_entries ce
             join catalogues c on c.cata_id = ce.cata_id
             join works w on w.id = ce.work_id and w.composer_id = c.composer_id
             where c.cata_abbr = $1 and ce.catalogue_number <> ''
         ) unique_works`,
        [catalogueCode],
    )

    return result.rows[0]?.count ?? 0
}

export async function getPostgresCatalogueEntryCount(catalogueCode: string): Promise<number> {
    const result = await getPool().query<{count: number}>(
        `select count(ce.entry_id)::int as count
         from catalogue_entries ce
         join catalogues c on c.cata_id = ce.cata_id
         where c.cata_abbr = $1`,
        [catalogueCode],
    )

    return result.rows[0]?.count ?? 0
}

export async function getPostgresCatalogueWorks(catalogueCode: string): Promise<DatabaseCatalogueWork[]> {
    const result = await getPool().query<{
        entryId: number
        workId: number
        catalogue: string
        opus: string | null
        date: string | null
        title: string | null
        type: string | null
        key: string | null
        instrumentation: string | null
        note: string | null
    }>(
        `select unique_entries."entryId",
                unique_entries."workId",
                unique_entries.catalogue,
                unique_entries.opus,
                unique_entries.date,
                unique_entries.title,
                unique_entries.type,
                unique_entries.key,
                unique_entries.instrumentation,
                unique_entries.note
         from (
             select distinct on (
                        ce.catalogue_number, ce.opus, ce.date,
                        w.title, w.type, w.tonality, w.instr, w.note
                    )
                    ce.entry_id::int as "entryId",
                    ce.work_id::int as "workId",
                    ce.catalogue_number as catalogue,
                    ce.opus,
                    ce.date,
                    w.title,
                    w.type,
                    w.tonality as key,
                    w.instr as instrumentation,
                    w.note,
                    ce.sort
             from catalogue_entries ce
             join catalogues c on c.cata_id = ce.cata_id
             join works w on w.id = ce.work_id and w.composer_id = c.composer_id
             where c.cata_abbr = $1 and ce.catalogue_number <> ''
             order by ce.catalogue_number, ce.opus, ce.date,
                      w.title, w.type, w.tonality, w.instr, w.note, ce.entry_id
         ) unique_entries
         order by unique_entries.sort nulls last,
                  unique_entries.catalogue, unique_entries."entryId"`,
        [catalogueCode],
    )

    return result.rows.map(work => {
        const opus = work.opus ?? ''
        const date = work.date ?? ''
        const title = work.title ?? ''
        const type = work.type ?? ''
        const key = work.key ?? ''
        const instrumentation = work.instrumentation ?? ''
        const note = work.note ?? ''

        return {
            workId: work.entryId,
            catalogue: work.catalogue,
            opus,
            secondaryCatalogue: '',
            date,
            title,
            type,
            key,
            instrumentation,
            details: {
                catalogue: work.catalogue,
                opus,
                date,
                title,
                type,
                key,
                instrumentation,
                note,
            },
        }
    })
}
