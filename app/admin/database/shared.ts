import type { AdminRow, AdminTableSchema } from '@/lib/db/admin'

/**
 * Constants and shared types for the admin database editor.
 * Kept out of actions.ts because a 'use server' module may only export async functions.
 */

/** Rows per page for the admin data editor (server-side LIMIT/OFFSET pagination). */
export const PAGE_SIZE = 10

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

export type TablePayload = {
    schema: AdminTableSchema
    rows: AdminRow[]
    fkLabels: Record<string, Record<string, string>>
    releaseArtists: Record<string, string[]>
    releaseComposers: Record<string, string[]>
    total: number
    page: number
    pageSize: number
}
