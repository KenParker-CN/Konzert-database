import 'server-only'

import { createClient, type Client } from '@libsql/client'

/**
 * Server-only data layer for the Admin database editor.
 *
 * Uses a singleton read-write @libsql/client. The public site uses the
 * same client via `getDatabase()` in `./sqlite.ts`.
 *
 * Identifiers (table / column names) are validated against the actual
 * schema before being quoted into SQL. All values are bound as parameters.
 */

let _writeClient: Client | null = null

function getWritableDatabase(): Client {
    if (!_writeClient) {
        _writeClient = createClient({
            url: process.env.TURSO_DATABASE_URL || 'file:./identifier.sqlite',
            authToken: process.env.TURSO_AUTH_TOKEN,
        })
    }
    return _writeClient
}

export type AdminColumn = {
    name: string
    type: string
    notNull: boolean
    defaultValue: string | null
    pkOrder: number
    isRowIdAlias: boolean
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

async function assertRealTable(db: Client, table: string) {
    if (!IDENTIFIER_PATTERN.test(table)) throw new Error(`Invalid table name: ${table}`)
    const result = await db.execute({
        sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
        args: [table],
    })
    if (!result.rows.length) throw new Error(`Unknown table: ${table}`)
}

async function tableColumns(db: Client, table: string) {
    const infoResult = await db.execute({
        sql: `SELECT * FROM pragma_table_info(?)`,
        args: [table],
    })
    const info = infoResult.rows as unknown as Array<{
        name: string
        type: string
        notnull: number
        dflt_value: string | null
        pk: number
    }>
    const createResult = await db.execute({
        sql: `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`,
        args: [table],
    })
    const createSql = (createResult.rows[0] as unknown as { sql: string | null } | undefined)?.sql ?? ''
    const autoIncrement = /\bAUTOINCREMENT\b/i.test(createSql)
    return { info, autoIncrement }
}

function isNumericType(type: string) {
    return /^(INTEGER|INT|REAL|FLOAT|DOUBLE|NUMERIC|DECIMAL)/i.test(type.trim())
}

function isTextSearchable(type: string) {
    return /(TEXT|CHAR|CLOB)/i.test(type)
}

export async function getTables(): Promise<string[]> {
    const db = getWritableDatabase()
    const result = await db.execute(
        `SELECT name FROM sqlite_master
         WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
         ORDER BY name`,
    )
    return (result.rows as unknown as Array<{ name: string }>).map(row => row.name)
}

export async function getTableRowCounts(tables: string[]): Promise<Map<string, number>> {
    const db = getWritableDatabase()
    const result = new Map<string, number>()
    for (const table of tables) {
        if (!IDENTIFIER_PATTERN.test(table)) continue
        const check = await db.execute({
            sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
            args: [table],
        })
        if (!check.rows.length) continue
        const countResult = await db.execute(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`)
        result.set(table, (countResult.rows[0] as unknown as { count: number }).count)
    }
    return result
}

export async function getTableSchema(table: string): Promise<AdminTableSchema> {
    const db = getWritableDatabase()
    await assertRealTable(db, table)
    const { info, autoIncrement } = await tableColumns(db, table)
    const pkColumns = info
        .filter(column => column.pk > 0)
        .sort((a, b) => a.pk - b.pk)
        .map(column => column.name)
    const fkResult = await db.execute({
        sql: `SELECT * FROM pragma_foreign_key_list(?)`,
        args: [table],
    })
    const fkRows = fkResult.rows as unknown as Array<{
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
    const countResult = await db.execute(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`)
    const rowCount = (countResult.rows[0] as unknown as { count: number }).count
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
}

async function searchClause(db: Client, table: string, search?: string) {
    if (!search?.trim()) return { sql: '', params: {} as Record<string, string> }
    const { info } = await tableColumns(db, table)
    const textColumns = info.filter(column => isTextSearchable(column.type)).map(column => column.name)
    if (!textColumns.length) return { sql: '', params: {} }
    const escaped = search.trim().replace(/[\\%_]/g, match => `\\${match}`)
    const sql = ` WHERE ${textColumns.map(name => `${quoteIdentifier(name)} LIKE @search ESCAPE '\\'`).join(' OR ')}`
    return { sql, params: { search: `%${escaped}%` } }
}

function orderClause(schema: AdminTableSchema) {
    if (schema.primaryKeys.length) {
        return schema.primaryKeys.map(name => `${quoteIdentifier(name)} ASC`).join(', ')
    }
    return 'rowid ASC'
}

export async function getRows(table: string, options: { page?: number; pageSize?: number; search?: string } = {}): Promise<{
    schema: AdminTableSchema
    rows: AdminRow[]
    total: number
    page: number
    pageSize: number
}> {
    const pageSize = options.pageSize ?? 25
    const page = Math.max(1, options.page ?? 1)
    const db = getWritableDatabase()
    const schema = await getTableSchema(table)
    const searchPart = await searchClause(db, table, options.search)
    const totalResult = await db.execute({
        sql: `SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}${searchPart.sql}`,
        args: searchPart.params,
    })
    const total = (totalResult.rows[0] as unknown as { count: number }).count
    const rowsResult = await db.execute({
        sql: `SELECT * FROM ${quoteIdentifier(table)}${searchPart.sql}
             ORDER BY ${orderClause(schema)}
             LIMIT @limit OFFSET @offset`,
        args: { ...searchPart.params, limit: pageSize, offset: (page - 1) * pageSize },
    })
    return { schema, rows: rowsResult.rows as unknown as AdminRow[], total, page, pageSize }
}

async function labelExpressionFor(db: Client, targetTable: string, targetPk: string) {
    if (targetTable === 'works') {
        return `CASE WHEN "catalog_no" IS NOT NULL AND "catalog_no" != '' AND "title" IS NOT NULL AND "title" != '' THEN "catalog_no" || ' · ' || "title" WHEN "catalog_no" IS NOT NULL AND "catalog_no" != '' THEN "catalog_no" ELSE COALESCE("title", '') END`
    }
    const { info } = await tableColumns(db, targetTable)
    const preferred = ['name', 'title', 'label', 'slug']
    for (const candidate of preferred) {
        if (info.some(column => column.name.toLowerCase() === candidate)) return quoteIdentifier(candidate)
    }
    const firstText = info.find(column => isTextSearchable(column.type) && column.name !== targetPk)
    if (firstText) return quoteIdentifier(firstText.name)
    return quoteIdentifier(targetPk)
}

export async function resolveForeignKeyLabels(
    table: string,
    rows: AdminRow[],
): Promise<Record<string, Record<string, string>>> {
    const schema = await getTableSchema(table)
    const result: Record<string, Record<string, string>> = {}
    if (!schema.foreignKeys.length || !rows.length) return result
    const db = getWritableDatabase()
    for (const fk of schema.foreignKeys) {
        await assertRealTable(db, fk.table)
        const values = [...new Set(rows
            .map(row => row[fk.from])
            .filter((value): value is string | number => value !== null && value !== undefined))]
        if (!values.length) continue
        const targetPk = fk.to
        if (!targetPk) continue
        const labelExpression = await labelExpressionFor(db, fk.table, targetPk)
        const placeholders = values.map((_, index) => `@value${index}`).join(', ')
        const params: Record<string, string | number> = {}
        values.forEach((value, index) => { params[`value${index}`] = value })
        const targetResult = await db.execute({
            sql: `SELECT ${quoteIdentifier(targetPk)} AS value, ${labelExpression} AS label
                 FROM ${quoteIdentifier(fk.table)}
                 WHERE ${quoteIdentifier(targetPk)} IN (${placeholders})`,
            args: params,
        })
        const targetRows = targetResult.rows as unknown as Array<{ value: string | number; label: string | null }>
        result[fk.from] = {}
        for (const targetRow of targetRows) {
            result[fk.from][String(targetRow.value)] = targetRow.label ?? String(targetRow.value)
        }
    }
    return result
}

export async function getForeignKeyOptions(table: string, column: string): Promise<{
    from: string
    targetTable: string
    targetColumn: string
    options: Array<{ value: string; label: string }>
}> {
    const schema = await getTableSchema(table)
    const fk = schema.foreignKeys.find(candidate => candidate.from === column)
    if (!fk) throw new Error(`Column ${column} is not a foreign key of ${table}`)
    const db = getWritableDatabase()
    await assertRealTable(db, fk.table)
    const targetInfo = await tableColumns(db, fk.table)
    const targetColumn = fk.to || targetInfo.info.filter(candidate => candidate.pk > 0)
        .sort((a, b) => a.pk - b.pk)[0]?.name || ''
    if (!targetColumn) throw new Error(`Cannot resolve target column for ${table}.${column}`)
    const labelExpression = await labelExpressionFor(db, fk.table, targetColumn)
    const targetResult = await db.execute(
        `SELECT ${quoteIdentifier(targetColumn)} AS value, ${labelExpression} AS label
         FROM ${quoteIdentifier(fk.table)}
         ORDER BY ${labelExpression} ASC
         LIMIT 5000`,
    )
    const targetRows = targetResult.rows as unknown as Array<{ value: string | number; label: string | null }>
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

export async function insertRow(table: string, data: Record<string, string | null>): Promise<{ insertedPk: Record<string, string | number | null> }> {
    const schema = await getTableSchema(table)
    const payload = writablePayload(schema, data)
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
    await assertRealTable(db, table)
    const columnSql = entries.map(([key]) => quoteIdentifier(key)).join(', ')
    const valueSql = entries.map(([key]) => `@${key}`).join(', ')
    const info = await db.execute({
        sql: `INSERT INTO ${quoteIdentifier(table)} (${columnSql}) VALUES (${valueSql})`,
        args: payload,
    })
    const insertedPk: Record<string, string | number | null> = {}
    if (schema.primaryKeys.length === 1 && schema.columns.find(column => column.name === schema.primaryKeys[0])?.isRowIdAlias) {
        insertedPk[schema.primaryKeys[0]] = Number(info.lastInsertRowid)
    } else {
        for (const key of schema.primaryKeys) insertedPk[key] = payload[key] ?? null
    }
    return { insertedPk }
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

export async function updateRow(table: string, pkValues: Record<string, string>, data: Record<string, string | null>): Promise<void> {
    const schema = await getTableSchema(table)
    assertPrimaryKeyValues(schema, pkValues)
    const payload = writablePayload(schema, data)
    const entries = Object.entries(payload)
    if (!entries.length) return
    const db = getWritableDatabase()
    await assertRealTable(db, table)
    const setSql = entries.map(([key]) => `${quoteIdentifier(key)} = @${key}`).join(', ')
    await db.execute({
        sql: `UPDATE ${quoteIdentifier(table)} SET ${setSql} WHERE ${pkWhereSql(schema)}`,
        args: { ...payload, ...pkParams(pkValues) },
    })
}

export async function deleteRow(table: string, pkValues: Record<string, string>): Promise<void> {
    const schema = await getTableSchema(table)
    assertPrimaryKeyValues(schema, pkValues)
    const db = getWritableDatabase()
    await assertRealTable(db, table)
    await db.execute({
        sql: `DELETE FROM ${quoteIdentifier(table)} WHERE ${pkWhereSql(schema)}`,
        args: pkParams(pkValues),
    })
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

export async function executeRawSql(sql: string): Promise<RawSqlResult> {
    const trimmed = sql.trim()
    if (!trimmed) return { type: 'empty' }

    const db = getWritableDatabase()

    if (WRITE_KEYWORDS.test(trimmed)) {
        const info = await db.execute(trimmed)
        return { type: 'write', changes: info.rowsAffected, lastInsertRowid: Number(info.lastInsertRowid) }
    }

    if (SELECT_KEYWORDS.test(trimmed)) {
        const result = await db.execute(trimmed)
        const rows = result.rows as Record<string, unknown>[]
        const columns = rows.length > 0 ? Object.keys(rows[0]) : []
        return { type: 'select', columns, rows }
    }

    const result = await db.execute(trimmed)
    const rows = result.rows as Record<string, unknown>[]
    const columns = rows.length > 0 ? Object.keys(rows[0]) : []
    return { type: 'select', columns, rows }
}

export async function getReleaseArtistIds(releaseId: number): Promise<number[]> {
    const db = getWritableDatabase()
    const result = await db.execute({
        sql: `SELECT artist_id FROM release_artists WHERE release_id = ? ORDER BY artist_id`,
        args: [releaseId],
    })
    return (result.rows as unknown as Array<{ artist_id: number }>).map(r => r.artist_id)
}

export async function getReleaseArtistsForRows(releaseIds: number[]): Promise<Record<string, string[]>> {
    if (!releaseIds.length) return {}
    const db = getWritableDatabase()
    const placeholders = releaseIds.map((_, i) => `@id${i}`).join(', ')
    const params: Record<string, number> = {}
    releaseIds.forEach((id, i) => { params[`id${i}`] = id })
    const result = await db.execute({
        sql: `SELECT ra.release_id, a.name AS artist_name
             FROM release_artists ra
             JOIN artists a ON a.artist_id = ra.artist_id
             WHERE ra.release_id IN (${placeholders})
             ORDER BY ra.release_id, a.name`,
        args: params,
    })
    const rows = result.rows as unknown as Array<{ release_id: number; artist_name: string }>
    const record: Record<string, string[]> = {}
    for (const row of rows) {
        const key = String(row.release_id)
        if (!record[key]) record[key] = []
        record[key].push(row.artist_name)
    }
    return record
}

export async function syncReleaseArtists(releaseId: number, artistIds: number[]): Promise<void> {
    const db = getWritableDatabase()
    await assertRealTable(db, 'release_artists')
    const tx = await db.transaction()
    await tx.execute({
        sql: `DELETE FROM release_artists WHERE release_id = ?`,
        args: [releaseId],
    })
    for (const artistId of artistIds) {
        await tx.execute({
            sql: `INSERT INTO release_artists (release_id, artist_id) VALUES (?, ?)`,
            args: [releaseId, artistId],
        })
    }
    await tx.commit()
}

export async function getReleaseComposerIds(releaseId: number): Promise<number[]> {
    const db = getWritableDatabase()
    const result = await db.execute({
        sql: `SELECT artist_id FROM release_composers WHERE release_id = ? ORDER BY is_primary DESC, artist_id`,
        args: [releaseId],
    })
    return (result.rows as unknown as Array<{ artist_id: number }>).map(r => r.artist_id)
}

export async function getReleaseComposersForRows(releaseIds: number[]): Promise<Record<string, string[]>> {
    if (!releaseIds.length) return {}
    const db = getWritableDatabase()
    const placeholders = releaseIds.map((_, i) => `@id${i}`).join(', ')
    const params: Record<string, number> = {}
    releaseIds.forEach((id, i) => { params[`id${i}`] = id })
    const result = await db.execute({
        sql: `SELECT rc.release_id, a.name AS composer_name
             FROM release_composers rc
             JOIN artists a ON a.artist_id = rc.artist_id
             WHERE rc.release_id IN (${placeholders})
             ORDER BY rc.release_id, rc.is_primary DESC, a.name`,
        args: params,
    })
    const rows = result.rows as unknown as Array<{ release_id: number; composer_name: string }>
    const record: Record<string, string[]> = {}
    for (const row of rows) {
        const key = String(row.release_id)
        if (!record[key]) record[key] = []
        record[key].push(row.composer_name)
    }
    return record
}

export async function syncReleaseComposers(releaseId: number, artistIds: number[]): Promise<void> {
    const db = getWritableDatabase()
    await assertRealTable(db, 'release_composers')
    const tx = await db.transaction()
    await tx.execute({
        sql: `DELETE FROM release_composers WHERE release_id = ?`,
        args: [releaseId],
    })
    for (let i = 0; i < artistIds.length; i++) {
        await tx.execute({
            sql: `INSERT INTO release_composers (release_id, artist_id, is_primary) VALUES (?, ?, ?)`,
            args: [releaseId, artistIds[i], i === 0 ? 1 : 0],
        })
    }
    await tx.commit()
}
