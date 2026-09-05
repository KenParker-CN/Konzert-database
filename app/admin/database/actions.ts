'use server'

import {
    deleteRow,
    detectSqlType,
    executeRawSql,
    getForeignKeyOptions,
    getReleaseArtistIds,
    getReleaseArtistsForRows,
    getReleaseComposerIds,
    getReleaseComposersForRows,
    getRows,
    getTableSchema,
    getTables,
    insertRow,
    resolveForeignKeyLabels,
    syncReleaseArtists,
    syncReleaseComposers,
    updateRow,
} from '@/lib/db/admin'
import type { AdminTableSchema } from '@/lib/db/admin'

import { PAGE_SIZE } from './shared'
import type { ActionResult, TablePayload } from './shared'

function assertAdminEnabled() {
    const enabled = process.env.NODE_ENV !== 'production' || process.env.ADMIN_DATABASE === '1'
    if (!enabled) throw new Error('Admin database editor is disabled in this environment.')
}

async function guarded<T>(operation: () => Promise<T>): Promise<ActionResult<T>> {
    try {
        assertAdminEnabled()
        return { ok: true, data: await operation() }
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function listTablesAction(): Promise<ActionResult<string[]>> {
    return guarded(() => getTables())
}

export async function loadTableAction(
    table: string,
    page: number,
    search?: string,
): Promise<ActionResult<TablePayload>> {
    return guarded(async () => {
        const result = await getRows(table, { page, pageSize: PAGE_SIZE, search })
        const fkLabels = await resolveForeignKeyLabels(table, result.rows)
        const releaseIds = table === 'releases'
            ? result.rows.map(row => Number(row['release_id'])).filter(id => !Number.isNaN(id))
            : []
        const releaseArtists = await getReleaseArtistsForRows(releaseIds)
        const releaseComposers = await getReleaseComposersForRows(releaseIds)
        return { ...result, fkLabels, releaseArtists, releaseComposers }
    })
}

export async function foreignKeyOptionsAction(
    table: string,
    column: string,
): Promise<ActionResult<Awaited<ReturnType<typeof getForeignKeyOptions>>>> {
    return guarded(() => getForeignKeyOptions(table, column))
}

export async function createRowAction(
    table: string,
    data: Record<string, string | null>,
): Promise<ActionResult<{ insertedPk: Record<string, string | number | null> }>> {
    return guarded(() => insertRow(table, data))
}

export async function updateRowAction(
    table: string,
    pkValues: Record<string, string>,
    data: Record<string, string | null>,
): Promise<ActionResult<true>> {
    return guarded(async () => {
        await updateRow(table, pkValues, data)
        return true as const
    })
}

export async function deleteRowAction(
    table: string,
    pkValues: Record<string, string>,
): Promise<ActionResult<true>> {
    return guarded(async () => {
        await deleteRow(table, pkValues)
        return true as const
    })
}

export async function getSchemaAction(table: string): Promise<ActionResult<AdminTableSchema>> {
    return guarded(() => getTableSchema(table))
}

export type SqlExecResult =
    | { ok: true; type: 'select'; columns: string[]; rows: Record<string, unknown>[] }
    | { ok: true; type: 'write'; changes: number; lastInsertRowid: string | number }
    | { ok: true; type: 'empty' }
    | { ok: true; type: 'needs_confirm'; sqlType: 'write'; sql: string }
    | { ok: false; error: string }

export async function executeSqlAction(
    sql: string,
    confirmed: boolean,
): Promise<SqlExecResult> {
    try {
        assertAdminEnabled()
        const trimmed = sql.trim()
        if (!trimmed) return { ok: true, type: 'empty' }

        const sqlType = detectSqlType(trimmed)

        if (sqlType === 'write' && !confirmed) {
            return { ok: true, type: 'needs_confirm', sqlType: 'write', sql: trimmed }
        }

        const result = await executeRawSql(trimmed)

        if (result.type === 'select') {
            return { ok: true, type: 'select', columns: result.columns, rows: result.rows }
        }
        if (result.type === 'write') {
            return { ok: true, type: 'write', changes: result.changes, lastInsertRowid: result.lastInsertRowid }
        }
        return { ok: true, type: 'empty' }
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function getReleaseArtistIdsAction(releaseId: number): Promise<ActionResult<number[]>> {
    return guarded(() => getReleaseArtistIds(releaseId))
}

export async function syncReleaseArtistsAction(
    releaseId: number,
    artistIds: number[],
): Promise<ActionResult<true>> {
    return guarded(async () => {
        await syncReleaseArtists(releaseId, artistIds)
        return true as const
    })
}

export async function getReleaseComposerIdsAction(releaseId: number): Promise<ActionResult<number[]>> {
    return guarded(() => getReleaseComposerIds(releaseId))
}

export async function syncReleaseComposersAction(
    releaseId: number,
    artistIds: number[],
): Promise<ActionResult<true>> {
    return guarded(async () => {
        await syncReleaseComposers(releaseId, artistIds)
        return true as const
    })
}
