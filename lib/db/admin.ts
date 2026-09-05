import 'server-only'

import Database from 'better-sqlite3'
import path from 'node:path'

/**
 * Server-only data layer for the local Admin database editor.
 *
 * - Uses its own read-write connection (the public site relies on the
 *   read-only `getDatabase()` in `./sqlite.ts` — that stays untouched).
 * - Identifiers (table / column names) are never taken from user input
 *   directly: every name is validated and cross-checked against the actual
 *   SQLite schema before being quoted into SQL. All values are bound as
 *   parameters.
 * - Only SELECT / INSERT / UPDATE / DELETE are implemented. There is no API
 *   that executes arbitrary SQL.
 */

const databasePath = process.env.ADMIN_DB_PATH
    ? path.resolve(process.env.ADMIN_DB_PATH)
    : path.join(process.cwd(), 'identifier.sqlite')

function getWritableDatabase() {
    const db = new Database(databasePath, { fileMustExist: true })
    db.pragma('foreign_keys = ON')
    return db
}

export type AdminColumn = {
    name: string
    type: string
    notNull: boolean
    defaultValue: string | null
    pkOrder: number // 0 = not part of the primary key, otherwise 1-based position
    isRowIdAlias: boolean // INTEGER PRIMARY KEY (auto rowid) — may be omitted on INSERT
}

export type AdminForeignKey = {
    from: string
    table: string
    to: string
}

export type AdminTableSchema = {
    name: string
    columns: AdminColumn[]
    primaryKeys: string[]
    foreignKeys: AdminForeignKey[]
    rowCount: number
    autoIncrement: boolean
}

export type AdminRow = Record<string, string | number | null>

const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

function quoteIdentifier(name: string) {
    return `"${name.replace(/"/g, '""')}"`
}

/** Only tables that actually exist in the schema pass through. */
function assertRealTable(db: Database.Database, table: string) {
    if (!IDENTIFIER_PATTERN.test(table)) throw new Error(`Invalid table name: ${table}`)
    const row = db.prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    ).get(table) as { name: string } | undefined
    if (!row) throw new Error(`Unknown table: ${table}`)
}

function tableColumns(db: Database.Database, table: string) {
    const info = db.pragma(`table_info(${quoteIdentifier(table)})`) as Array<{
        name: string
        type: string
        notnull: number
        dflt_value: string | null
        pk: number
    }>
    const createSql = (db.prepare(
        `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`,
    ).get(table) as { sql: string | null } | undefined)?.sql ?? ''
    const autoIncrement = /\bAUTOINCREMENT\b/i.test(createSql)
    return { info, autoIncrement }
}

function isNumericType(type: string) {
    return /^(INTEGER|INT|REAL|FLOAT|DOUBLE|NUMERIC|DECIMAL)/i.test(type.trim())
}

function isTextSearchable(type: string) {
    return /(TEXT|CHAR|CLOB)/i.test(type)
}

export function getTables(): string[] {
    const db = getWritableDatabase()
    try {
        const rows = db.prepare(
            `SELECT name FROM sqlite_master
             WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
             ORDER BY name`,
        ).all() as Array<{ name: string }>
        return rows.map(row => row.name)
    } finally {
        db.close()
    }
}

export function getTableRowCounts(tables: string[]): Map<string, number> {
    const db = getWritableDatabase()
    try {
        const result = new Map<string, number>()
        for (const table of tables) {
            if (!IDENTIFIER_PATTERN.test(table)) continue
            const row = db.prepare(
                `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
            ).get(table) as { name: string } | undefined
            if (!row) continue
            const count = (db.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`).get() as { count: number }).count
            result.set(table, count)
        }
        return result
    } finally {
        db.close()
    }
}

export function getTableSchema(table: string): AdminTableSchema {
    const db = getWritableDatabase()
    try {
        assertRealTable(db, table)
        const { info, autoIncrement } = tableColumns(db, table)
        const pkColumns = info
            .filter(column => column.pk > 0)
            .sort((a, b) => a.pk - b.pk)
            .map(column => column.name)
        const fkRows = db.pragma(`foreign_key_list(${quoteIdentifier(table)})`) as Array<{
            from: string
            table: string
            to: string | null
        }>
        const foreignKeys: AdminForeignKey[] = fkRows.map(fk => ({
            from: fk.from,
            table: fk.table,
            to: fk.to ?? '',
        }))
        const singleIntegerPk = pkColumns.length === 1 &&
            isNumericType(info.find(column => column.name === pkColumns[0])?.type ?? '')
        const rowCount = (db.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`).get() as { count: number }).count
        return {
            name: table,
            columns: info.map(column => ({
                name: column.name,
                type: (column.type || '').toUpperCase(),
                notNull: column.notnull === 1,
                defaultValue: column.dflt_value,
                pkOrder: column.pk,
                isRowIdAlias: singleIntegerPk && column.pk === 1,
            })),
            primaryKeys: pkColumns,
            foreignKeys,
            rowCount,
            autoIncrement,
        }
    } finally {
        db.close()
    }
}

function searchClause(table: string, search?: string) {
    if (!search?.trim()) return { sql: '', params: {} as Record<string, string> }
    const db = getWritableDatabase()
    try {
        const { info } = tableColumns(db, table)
        const textColumns = info.filter(column => isTextSearchable(column.type)).map(column => column.name)
        if (!textColumns.length) return { sql: '', params: {} }
        const escaped = search.trim().replace(/[\\%_]/g, match => `\\${match}`)
        const sql = ` WHERE ${textColumns.map(name => `${quoteIdentifier(name)} LIKE @search ESCAPE '\\'`).join(' OR ')}`
        return { sql, params: { search: `%${escaped}%` } }
    } finally {
        db.close()
    }
}

function orderClause(schema: AdminTableSchema) {
    if (schema.primaryKeys.length) {
        return schema.primaryKeys.map(name => `${quoteIdentifier(name)} ASC`).join(', ')
    }
    return 'rowid ASC'
}

export function getRows(table: string, options: { page?: number; pageSize?: number; search?: string } = {}): {
    schema: AdminTableSchema
    rows: AdminRow[]
    total: number
    page: number
    pageSize: number
} {
    const pageSize = options.pageSize ?? 25
    const page = Math.max(1, options.page ?? 1)
    const schema = getTableSchema(table)
    const searchPart = searchClause(table, options.search)
    const db = getWritableDatabase()
    try {
        const total = (db.prepare(
            `SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}${searchPart.sql}`,
        ).get(searchPart.params) as { count: number }).count
        const rows = db.prepare(
            `SELECT * FROM ${quoteIdentifier(table)}${searchPart.sql}
             ORDER BY ${orderClause(schema)}
             LIMIT @limit OFFSET @offset`,
        ).all({ ...searchPart.params, limit: pageSize, offset: (page - 1) * pageSize }) as AdminRow[]
        return { schema, rows, total, page, pageSize }
    } finally {
        db.close()
    }
}

/** Pick a readable label column from the target table (name → title → first TEXT column). */
function labelExpressionFor(db: Database.Database, targetTable: string, targetPk: string) {
    if (targetTable === 'works') {
        return `CASE WHEN "catalog_no" IS NOT NULL AND "catalog_no" != '' AND "title" IS NOT NULL AND "title" != '' THEN "catalog_no" || ' · ' || "title" WHEN "catalog_no" IS NOT NULL AND "catalog_no" != '' THEN "catalog_no" ELSE COALESCE("title", '') END`
    }
    const { info } = tableColumns(db, targetTable)
    const preferred = ['name', 'title', 'label', 'slug']
    for (const candidate of preferred) {
        if (info.some(column => column.name.toLowerCase() === candidate)) return quoteIdentifier(candidate)
    }
    const firstText = info.find(column => isTextSearchable(column.type) && column.name !== targetPk)
    if (firstText) return quoteIdentifier(firstText.name)
    return quoteIdentifier(targetPk)
}

/**
 * For every foreign-key column: resolve the labels of the values that appear
 * in the given rows, so the UI can show "Wolfgang Amadeus Mozart" next to
 * (or instead of) a raw `artist_id = 1`.
 */
export function resolveForeignKeyLabels(
    table: string,
    rows: AdminRow[],
): Record<string, Record<string, string>> {
    const schema = getTableSchema(table)
    const result: Record<string, Record<string, string>> = {}
    if (!schema.foreignKeys.length || !rows.length) return result
    const db = getWritableDatabase()
    try {
        for (const fk of schema.foreignKeys) {
            assertRealTable(db, fk.table)
            const values = [...new Set(rows
                .map(row => row[fk.from])
                .filter((value): value is string | number => value !== null && value !== undefined))]
            if (!values.length) continue
            const targetPk = fk.to
            if (!targetPk) continue
            const labelExpression = labelExpressionFor(db, fk.table, targetPk)
            const placeholders = values.map((_, index) => `@value${index}`).join(', ')
            const params: Record<string, string | number> = {}
            values.forEach((value, index) => { params[`value${index}`] = value })
            const targetRows = db.prepare(
                `SELECT ${quoteIdentifier(targetPk)} AS value, ${labelExpression} AS label
                 FROM ${quoteIdentifier(fk.table)}
                 WHERE ${quoteIdentifier(targetPk)} IN (${placeholders})`,
            ).all(params) as Array<{ value: string | number; label: string | null }>
            result[fk.from] = {}
            for (const targetRow of targetRows) {
                result[fk.from][String(targetRow.value)] = targetRow.label ?? String(targetRow.value)
            }
        }
        return result
    } finally {
        db.close()
    }
}

/** Options for one foreign-key column, used by the Add/Edit form selectors. */
export function getForeignKeyOptions(table: string, column: string): {
    from: string
    targetTable: string
    targetColumn: string
    options: Array<{ value: string; label: string }>
} {
    const schema = getTableSchema(table)
    const fk = schema.foreignKeys.find(candidate => candidate.from === column)
    if (!fk) throw new Error(`Column ${column} is not a foreign key of ${table}`)
    const db = getWritableDatabase()
    try {
        assertRealTable(db, fk.table)
        const targetInfo = tableColumns(db, fk.table)
        const targetColumn = fk.to || targetInfo.info.filter(candidate => candidate.pk > 0)
            .sort((a, b) => a.pk - b.pk)[0]?.name || ''
        if (!targetColumn) throw new Error(`Cannot resolve target column for ${table}.${column}`)
        const labelExpression = labelExpressionFor(db, fk.table, targetColumn)
        const targetRows = db.prepare(
            `SELECT ${quoteIdentifier(targetColumn)} AS value, ${labelExpression} AS label
             FROM ${quoteIdentifier(fk.table)}
             ORDER BY ${labelExpression} ASC
             LIMIT 5000`,
        ).all() as Array<{ value: string | number; label: string | null }>
        return {
            from: column,
            targetTable: fk.table,
            targetColumn,
            options: targetRows.map(row => ({
                value: String(row.value),
                label: row.label !== null && row.label !== undefined && row.label !== ''
                    ? row.label
                    : String(row.value),
            })),
        }
    } finally {
        db.close()
    }
}

function coerceValue(column: AdminColumn, rawValue: string | null): string | number | null {
    if (rawValue === null || rawValue === '') {
        return null
    }
    if (isNumericType(column.type)) {
        const numeric = Number(rawValue)
        if (Number.isNaN(numeric)) throw new Error(`Column ${column.name} expects a number, got "${rawValue}"`)
        return numeric
    }
    return rawValue
}

function writablePayload(schema: AdminTableSchema, data: Record<string, string | null>) {
    const payload: Record<string, string | number | null> = {}
    for (const [key, rawValue] of Object.entries(data)) {
        const column = schema.columns.find(candidate => candidate.name === key)
        if (!column) throw new Error(`Unknown column: ${key}`)
        payload[key] = coerceValue(column, rawValue)
    }
    return payload
}

export function insertRow(table: string, data: Record<string, string | null>): { insertedPk: Record<string, string | number | null> } {
    const schema = getTableSchema(table)
    const payload = writablePayload(schema, data)
    // Auto rowid PKs are filled by SQLite — drop them when empty.
    for (const column of schema.columns) {
        if (column.isRowIdAlias && (payload[column.name] === null || payload[column.name] === undefined)) {
            delete payload[column.name]
        }
    }
    for (const column of schema.columns) {
        const missing = payload[column.name] === null || payload[column.name] === undefined
        if (column.notNull && !column.isRowIdAlias && missing && column.defaultValue === null) {
            throw new Error(`Column ${column.name} is NOT NULL and requires a value`)
        }
    }
    const entries = Object.entries(payload)
    if (!entries.length) throw new Error('Nothing to insert')
    const db = getWritableDatabase()
    try {
        assertRealTable(db, table)
        const columnSql = entries.map(([key]) => quoteIdentifier(key)).join(', ')
        const valueSql = entries.map(([key]) => `@${key}`).join(', ')
        const info = db.prepare(
            `INSERT INTO ${quoteIdentifier(table)} (${columnSql}) VALUES (${valueSql})`,
        ).run(payload)
        const insertedPk: Record<string, string | number | null> = {}
        if (schema.primaryKeys.length === 1 && schema.columns.find(column => column.name === schema.primaryKeys[0])?.isRowIdAlias) {
            insertedPk[schema.primaryKeys[0]] = Number(info.lastInsertRowid)
        } else {
            for (const key of schema.primaryKeys) insertedPk[key] = payload[key] ?? null
        }
        return { insertedPk }
    } finally {
        db.close()
    }
}

function assertPrimaryKeyValues(schema: AdminTableSchema, pkValues: Record<string, string>) {
    if (!schema.primaryKeys.length) throw new Error(`Table ${schema.name} has no primary key`)
    for (const key of schema.primaryKeys) {
        if (pkValues[key] === undefined) throw new Error(`Missing primary key value: ${key}`)
    }
}

function pkWhereSql(schema: AdminTableSchema) {
    return schema.primaryKeys.map(key => `${quoteIdentifier(key)} = @pk_${key}`).join(' AND ')
}

function pkParams(pkValues: Record<string, string>) {
    const params: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(pkValues)) params[`pk_${key}`] = value
    return params
}

export function updateRow(table: string, pkValues: Record<string, string>, data: Record<string, string | null>): void {
    const schema = getTableSchema(table)
    assertPrimaryKeyValues(schema, pkValues)
    const payload = writablePayload(schema, data)
    const entries = Object.entries(payload)
    if (!entries.length) return
    const db = getWritableDatabase()
    try {
        assertRealTable(db, table)
        const setSql = entries.map(([key]) => `${quoteIdentifier(key)} = @${key}`).join(', ')
        db.prepare(
            `UPDATE ${quoteIdentifier(table)} SET ${setSql} WHERE ${pkWhereSql(schema)}`,
        ).run({ ...payload, ...pkParams(pkValues) })
    } finally {
        db.close()
    }
}

export function deleteRow(table: string, pkValues: Record<string, string>): void {
    const schema = getTableSchema(table)
    assertPrimaryKeyValues(schema, pkValues)
    const db = getWritableDatabase()
    try {
        assertRealTable(db, table)
        db.prepare(`DELETE FROM ${quoteIdentifier(table)} WHERE ${pkWhereSql(schema)}`).run(pkParams(pkValues))
    } finally {
        db.close()
    }
}

export type RawSqlResult =
    | { type: 'select'; columns: string[]; rows: Record<string, unknown>[] }
    | { type: 'write'; changes: number; lastInsertRowid: string | number }
    | { type: 'empty' }

const WRITE_KEYWORDS = /^\s*(INSERT|UPDATE|DELETE|REPLACE)\b/i
const SELECT_KEYWORDS = /^\s*(SELECT|WITH|PRAGMA|EXPLAIN)\b/i

export function detectSqlType(sql: string): 'select' | 'write' {
    return WRITE_KEYWORDS.test(sql) ? 'write' : 'select'
}

export function executeRawSql(sql: string): RawSqlResult {
    const trimmed = sql.trim()
    if (!trimmed) return { type: 'empty' }

    const db = getWritableDatabase()
    try {
        if (WRITE_KEYWORDS.test(trimmed)) {
            const run = db.transaction(() => {
                return db.prepare(trimmed).run()
            })
            const info = run()
            return { type: 'write', changes: info.changes, lastInsertRowid: Number(info.lastInsertRowid) }
        }

        if (SELECT_KEYWORDS.test(trimmed)) {
            const rows = db.prepare(trimmed).all() as Record<string, unknown>[]
            const columns = rows.length > 0 ? Object.keys(rows[0]) : []
            return { type: 'select', columns, rows }
        }

        const rows = db.prepare(trimmed).all() as Record<string, unknown>[]
        const columns = rows.length > 0 ? Object.keys(rows[0]) : []
        return { type: 'select', columns, rows }
    } finally {
        db.close()
    }
}

export function getReleaseArtistIds(releaseId: number): number[] {
    const db = getWritableDatabase()
    try {
        const rows = db.prepare(
            `SELECT artist_id FROM release_artists WHERE release_id = ? ORDER BY artist_id`,
        ).all(releaseId) as Array<{ artist_id: number }>
        return rows.map(r => r.artist_id)
    } finally {
        db.close()
    }
}

/** Resolve artist names for a batch of releases from the release_artists junction table. */
export function getReleaseArtistsForRows(releaseIds: number[]): Record<string, string[]> {
    if (!releaseIds.length) return {}
    const db = getWritableDatabase()
    try {
        const placeholders = releaseIds.map((_, i) => `@id${i}`).join(', ')
        const params: Record<string, number> = {}
        releaseIds.forEach((id, i) => { params[`id${i}`] = id })
        const rows = db.prepare(
            `SELECT ra.release_id, a.name AS artist_name
             FROM release_artists ra
             JOIN artists a ON a.artist_id = ra.artist_id
             WHERE ra.release_id IN (${placeholders})
             ORDER BY ra.release_id, a.name`,
        ).all(params) as Array<{ release_id: number; artist_name: string }>
        const result: Record<string, string[]> = {}
        for (const row of rows) {
            const key = String(row.release_id)
            if (!result[key]) result[key] = []
            result[key].push(row.artist_name)
        }
        return result
    } finally {
        db.close()
    }
}

export function syncReleaseArtists(releaseId: number, artistIds: number[]): void {
    const db = getWritableDatabase()
    try {
        assertRealTable(db, 'release_artists')
        const sync = db.transaction(() => {
            db.prepare(`DELETE FROM release_artists WHERE release_id = ?`).run(releaseId)
            const insert = db.prepare(
                `INSERT INTO release_artists (release_id, artist_id) VALUES (?, ?)`,
            )
            for (const artistId of artistIds) {
                insert.run(releaseId, artistId)
            }
        })
        sync()
    } finally {
        db.close()
    }
}

export function getReleaseComposerIds(releaseId: number): number[] {
    const db = getWritableDatabase()
    try {
        const rows = db.prepare(
            `SELECT artist_id FROM release_composers WHERE release_id = ? ORDER BY is_primary DESC, artist_id`,
        ).all(releaseId) as Array<{ artist_id: number }>
        return rows.map(r => r.artist_id)
    } finally {
        db.close()
    }
}

export function getReleaseComposersForRows(releaseIds: number[]): Record<string, string[]> {
    if (!releaseIds.length) return {}
    const db = getWritableDatabase()
    try {
        const placeholders = releaseIds.map((_, i) => `@id${i}`).join(', ')
        const params: Record<string, number> = {}
        releaseIds.forEach((id, i) => { params[`id${i}`] = id })
        const rows = db.prepare(
            `SELECT rc.release_id, a.name AS composer_name
             FROM release_composers rc
             JOIN artists a ON a.artist_id = rc.artist_id
             WHERE rc.release_id IN (${placeholders})
             ORDER BY rc.release_id, rc.is_primary DESC, a.name`,
        ).all(params) as Array<{ release_id: number; composer_name: string }>
        const result: Record<string, string[]> = {}
        for (const row of rows) {
            const key = String(row.release_id)
            if (!result[key]) result[key] = []
            result[key].push(row.composer_name)
        }
        return result
    } finally {
        db.close()
    }
}

export function syncReleaseComposers(releaseId: number, artistIds: number[]): void {
    const db = getWritableDatabase()
    try {
        assertRealTable(db, 'release_composers')
        const sync = db.transaction(() => {
            db.prepare(`DELETE FROM release_composers WHERE release_id = ?`).run(releaseId)
            const insert = db.prepare(
                `INSERT INTO release_composers (release_id, artist_id, is_primary) VALUES (?, ?, ?)`,
            )
            for (let i = 0; i < artistIds.length; i++) {
                insert.run(releaseId, artistIds[i], i === 0 ? 1 : 0)
            }
        })
        sync()
    } finally {
        db.close()
    }
}
