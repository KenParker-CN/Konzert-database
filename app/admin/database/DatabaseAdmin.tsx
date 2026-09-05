'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
    ArrowRight,
    ChevronDown,
    ChevronsUpDown,
    ChevronUp,
    KeyRound,
    Pencil,
    Plus,
    RefreshCw,
    RotateCcw,
    Trash2,
} from 'lucide-react'
import TablePagination, { PageCountText, PageButtons } from './TablePagination'
import type { AdminRow, AdminTableSchema } from '@/lib/db/admin'
import {
    deleteRowAction,
    loadTableAction,
} from './actions'
import type { TablePayload } from './shared'
import RowFormModal from './RowFormModal'
import type { SortDirection, SortField } from '@/lib/hooks/useTableSort'
import { filterColumnsForTable, getFieldLabel, isPkColumnVisibleInTable, sortColumnsByFieldOrder } from './fieldMetadata'
import { toast as showToast } from '@/components/ui/toast'

type Modal =
    | { mode: 'create' }
    | { mode: 'edit'; pkValues: Record<string, string>; row: AdminRow }
    | null

function pkValuesOf(schema: AdminTableSchema, row: AdminRow): Record<string, string> {
    const values: Record<string, string> = {}
    for (const key of schema.primaryKeys) values[key] = String(row[key] ?? '')
    return values
}

function formatValue(value: string | number | null) {
    if (value === null) return 'NULL'
    if (typeof value === 'number') return String(value)
    return value
}

// Default sort for admin tables: by first PK ascending
function defaultSortForTable(schema: AdminTableSchema): SortField<string>[] {
    if (schema.primaryKeys.length > 0) {
        return [{ key: schema.primaryKeys[0], direction: 'asc' }]
    }
    if (schema.columns.length > 0) {
        return [{ key: schema.columns[0].name, direction: 'asc' }]
    }
    return []
}

export default function DatabaseAdmin({ table }: { table: string }) {
    const [data, setData] = useState<TablePayload | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [page, setPage] = useState(1)
    const [modal, setModal] = useState<Modal>(null)
    const [deleteTarget, setDeleteTarget] = useState<AdminRow | null>(null)
    const [sortFields, setSortFields] = useState<SortField<string>[]>([])

    const reload = useCallback(async (targetTable: string, targetPage: number) => {
        if (!targetTable) return
        setLoading(true)
        setError(false)
        const result = await loadTableAction(targetTable, targetPage)
        if (result.ok) {
            setData(result.data)
        } else {
            showToast.add({ description: result.error, type: 'error' })
            setError(true)
            setData(null)
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        void reload(table, page)
    }, [table, page, reload])

    useEffect(() => {
        setPage(1)
    }, [table])

    const schema = data?.schema ?? null

    const fkByColumn = useMemo(() => {
        const map = new Map<string, { table: string; to: string }>()
        if (schema) for (const fk of schema.foreignKeys) map.set(fk.from, { table: fk.table, to: fk.to })
        return map
    }, [schema])

    const visibleColumns = useMemo(() => {
        if (!schema) return []
        const filtered = filterColumnsForTable(schema.name, schema.columns)
        const withoutPkId = filtered.filter(col => !(col.pkOrder > 0 && col.name.endsWith('_id') && !isPkColumnVisibleInTable(schema.name, col.name)))
        return sortColumnsByFieldOrder(schema.name, withoutPkId)
    }, [schema])

    // Sort data
    const sortedRows = useMemo(() => {
        if (!data?.rows || sortFields.length === 0) return data?.rows ?? []

        return [...data.rows].sort((a, b) => {
            for (const field of sortFields) {
                const aVal = a[field.key]
                const bVal = b[field.key]

                // Handle null/undefined
                if (aVal === null || aVal === undefined) {
                    if (bVal === null || bVal === undefined) continue
                    return 1
                }
                if (bVal === null || bVal === undefined) return -1

                let result: number
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    result = aVal - bVal
                } else {
                    result = String(aVal).localeCompare(String(bVal), undefined, {
                        numeric: true,
                        sensitivity: 'base',
                    })
                }

                if (result !== 0) {
                    return field.direction === 'asc' ? result : -result
                }
            }
            return 0
        })
    }, [data?.rows, sortFields])

    const toggleSort = useCallback((key: string) => {
        setSortFields(current => {
            const existing = current.find(f => f.key === key)
            if (existing) {
                if (existing.direction === 'asc') {
                    return current.map(f => f.key === key ? { ...f, direction: 'desc' as SortDirection } : f)
                } else {
                    return current.filter(f => f.key !== key)
                }
            } else {
                return [...current, { key, direction: 'asc' as SortDirection }]
            }
        })
        setPage(1)
    }, [])

    const resetSort = useCallback(() => {
        if (schema) {
            setSortFields(defaultSortForTable(schema))
        }
    }, [schema])

    const getSortState = useCallback((key: string): { active: boolean; direction: SortDirection | null; priority: number | null } => {
        const index = sortFields.findIndex(f => f.key === key)
        if (index === -1) {
            return { active: false, direction: null, priority: null }
        }
        return { active: true, direction: sortFields[index].direction, priority: index + 1 }
    }, [sortFields])

    async function handleDelete() {
        if (!deleteTarget || !schema) return
        const values = pkValuesOf(schema, deleteTarget)
        const result = await deleteRowAction(schema.name, values)
        setDeleteTarget(null)
        if (result.ok) {
            showToast.add({ description: `Row deleted from ${schema.name}.`, type: 'success' })
            void reload(table, page)
        } else {
            showToast.add({ description: result.error, type: 'error' })
            setError(true)
        }
    }

    const cellClass = 'max-w-[280px] truncate px-3 py-2.5 align-middle text-slate-700'

    return (
        <div>
            {!data && !error && (
                <div className="animate-pulse">
                    <div className="flex items-center justify-end gap-2">
                        <div className="h-10 w-24 rounded-xl bg-slate-100" />
                        <div className="h-10 w-28 rounded-xl bg-slate-100" />
                    </div>
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="h-10 rounded-xl bg-slate-50" />
                        <div className="mt-4 space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-10 rounded-lg bg-slate-50" />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {schema && data && (
                <>
                    {/* Toolbar: count | page buttons | actions */}
                    <div className="flex items-center gap-2">
                        <PageCountText page={data.page} pageSize={data.pageSize} total={data.total} />
                        <div className="flex-1 flex justify-center">
                            <PageButtons page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => void reload(table, page)}
                                    className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100">
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Refresh
                            </button>
                            <button type="button" onClick={() => setModal({ mode: 'create' })}
                                    className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200">
                                <Plus size={16} aria-hidden="true" /> Add row
                            </button>
                        </div>
                    </div>
                    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    {/* Rows */}
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full min-w-max border-collapse text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    {visibleColumns.map(column => {
                                        const sortState = getSortState(column.name)
                                        const isPk = column.pkOrder > 0
                                        const isFk = fkByColumn.has(column.name)
                                        const showArtistsBefore = schema.name === 'releases' && column.name === 'composer_id'

                                        if (showArtistsBefore) {
                                            return (
                                                <Fragment key={column.name}>
                                                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">
                                                        Composers
                                                    </th>
                                                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">
                                                        Artists
                                                    </th>
                                                    <th key={column.name} className="whitespace-nowrap px-3 py-3 font-semibold">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSort(column.name)}
                                                            className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                                                sortState.active ? 'text-blue-700 font-semibold' : 'text-slate-500 hover:text-blue-700'
                                                            }`}
                                                            aria-label={sortState.active && sortState.direction
                                                                ? `Sorted ${sortState.direction === 'asc' ? 'ascending' : 'descending'} by ${column.name}. Click to ${sortState.direction === 'asc' ? 'sort descending' : 'remove sort'}.`
                                                                : `Sort by ${column.name}`
                                                            }
                                                        >
                                                            {isPk && (
                                                                <KeyRound size={10} className={sortState.active ? 'text-amber-500' : 'text-slate-300'} aria-label="primary key" />
                                                            )}
                                                            {isFk && !isPk && (
                                                                <ArrowRight size={10} className={sortState.active ? 'text-blue-400' : 'text-slate-300'} aria-label="foreign key" />
                                                            )}
                                                            {getFieldLabel(schema.name, column.name)}
                                                            <span className="relative ml-1">
                                                                {sortState.active && sortState.direction ? (
                                                                    sortState.direction === 'asc' ? (
                                                                        <ChevronUp size={12} className="text-blue-600" aria-hidden="true" />
                                                                    ) : (
                                                                        <ChevronDown size={12} className="text-blue-600" aria-hidden="true" />
                                                                    )
                                                                ) : (
                                                                    <ChevronsUpDown size={12} className="text-slate-300 opacity-0 group-hover:opacity-100" aria-hidden="true" />
                                                                )}
                                                                {sortState.active && sortState.priority !== null && sortState.priority > 1 && (
                                                                    <span className="absolute -top-1 -right-2 flex h-3 w-3 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white">
                                                                        {sortState.priority}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </button>
                                                    </th>
                                                </Fragment>
                                            )
                                        }

                                        return (
                                            <th key={column.name} className="whitespace-nowrap px-3 py-3 font-semibold">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSort(column.name)}
                                                    className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                                        sortState.active ? 'text-blue-700 font-semibold' : 'text-slate-500 hover:text-blue-700'
                                                    }`}
                                                    aria-label={sortState.active && sortState.direction
                                                        ? `Sorted ${sortState.direction === 'asc' ? 'ascending' : 'descending'} by ${column.name}. Click to ${sortState.direction === 'asc' ? 'sort descending' : 'remove sort'}.`
                                                        : `Sort by ${column.name}`
                                                    }
                                                >
                                                    {isPk && (
                                                        <KeyRound size={10} className={sortState.active ? 'text-amber-500' : 'text-slate-300'} aria-label="primary key" />
                                                    )}
                                                    {isFk && !isPk && (
                                                        <ArrowRight size={10} className={sortState.active ? 'text-blue-400' : 'text-slate-300'} aria-label="foreign key" />
                                                    )}
                                                    {getFieldLabel(schema.name, column.name)}
                                                    <span className="relative ml-1">
                                                        {sortState.active && sortState.direction ? (
                                                            sortState.direction === 'asc' ? (
                                                                <ChevronUp size={12} className="text-blue-600" aria-hidden="true" />
                                                            ) : (
                                                                <ChevronDown size={12} className="text-blue-600" aria-hidden="true" />
                                                            )
                                                        ) : (
                                                            <ChevronsUpDown size={12} className="text-slate-300 opacity-0 group-hover:opacity-100" aria-hidden="true" />
                                                        )}
                                                        {sortState.active && sortState.priority !== null && sortState.priority > 1 && (
                                                            <span className="absolute -top-1 -right-2 flex h-3 w-3 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white">
                                                                {sortState.priority}
                                                            </span>
                                                        )}
                                                    </span>
                                                </button>
                                            </th>
                                        )
                                    })}
                                    <th className="sticky right-0 z-10 bg-white px-4 py-3 font-semibold text-right">
                                        <span className="inline-flex items-center gap-1.5">
                                            Actions
                                            {sortFields.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={resetSort}
                                                    className="text-slate-400 hover:text-blue-600 focus:outline-none"
                                                    title="Reset to default sort"
                                                    aria-label="Reset to default sort"
                                                >
                                                    <RotateCcw size={10} />
                                                </button>
                                            )}
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRows.map((row, index) => (
                                    <tr key={index} className="group border-b border-slate-100 last:border-0 hover:bg-blue-50/50">
                                        {visibleColumns.map(column => {
                                            const value = row[column.name] ?? null
                                            const fk = fkByColumn.get(column.name)
                                            const label = value !== null ? data.fkLabels[column.name]?.[String(value)] : undefined
                                            const showArtistsBefore = schema.name === 'releases' && column.name === 'composer_id'

                                            if (showArtistsBefore) {
                                                const composers = data.releaseComposers[String(row['release_id'])] ?? []
                                                const artists = data.releaseArtists[String(row['release_id'])] ?? []
                                                return (
                                                    <Fragment key={column.name}>
                                                        <td className={cellClass} title={composers.length ? composers.join(', ') : 'No composers'}>
                                                            {composers.length
                                                                ? <span className="font-medium text-blue-700">{composers.join(', ')}</span>
                                                                : <span className="italic text-slate-300">NULL</span>}
                                                        </td>
                                                        <td className={cellClass} title={artists.length ? artists.join(', ') : 'No artists'}>
                                                            {artists.length
                                                                ? <span className="font-medium text-blue-700">{artists.join(', ')}</span>
                                                                : <span className="italic text-slate-300">NULL</span>}
                                                        </td>
                                                        <td key={column.name} className={cellClass} title={value === null ? 'NULL' : `${column.name} = ${formatValue(value)}`}>
                                                            {value === null
                                                                ? <span className="italic text-slate-300">NULL</span>
                                                                : fk && label
                                                                    ? <span className="font-medium text-blue-700">{label}</span>
                                                                    : formatValue(value)}
                                                        </td>
                                                    </Fragment>
                                                )
                                            }

                                            return (
                                                <td key={column.name} className={cellClass} title={value === null ? 'NULL' : `${column.name} = ${formatValue(value)}`}>
                                                    {value === null
                                                        ? <span className="italic text-slate-300">NULL</span>
                                                        : fk && label
                                                            ? <span className="font-medium text-blue-700">{label}</span>
                                                            : formatValue(value)}
                                                </td>
                                            )
                                        })}
                                        <td className="sticky right-0 z-10 bg-white px-4 py-2.5 text-right align-middle whitespace-nowrap group-hover:bg-blue-50/50">
                                            <div className="inline-flex gap-1.5">
                                                <button type="button" onClick={() => setModal({ mode: 'edit', pkValues: pkValuesOf(schema, row), row })}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200" aria-label="Edit row">
                                                    <Pencil size={15} />
                                                </button>
                                                <button type="button" onClick={() => setDeleteTarget(row)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-200" aria-label="Delete row">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!data.rows.length && (
                                    <tr><td colSpan={visibleColumns.length + (schema.name === 'releases' ? 3 : 1)} className="px-6 py-12 text-center text-sm text-slate-500">No rows match this search.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
                </>
            )}

            {modal && schema && (
                <RowFormModal
                    key={modal.mode === 'edit' ? `edit-${Object.values(modal.pkValues).join('-')}` : 'create'}
                    schema={schema}
                    mode={modal.mode}
                    row={modal.mode === 'edit' ? modal.row : null}
                    onClose={() => setModal(null)}
                    onSaved={message => {
                        setModal(null)
                        showToast.add({ description: message, type: 'success' })
                        void reload(table, page)
                    }}
                />
            )}

            {/* Delete confirmation */}
            {deleteTarget && schema && (
                <div role="dialog" aria-modal="true" aria-label="Delete row"
                     className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-5"
                     onClick={() => setDeleteTarget(null)}>
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={event => event.stopPropagation()}>
                        <h3 className="heading text-lg font-semibold text-slate-900">Delete this row?</h3>
                        <p className="mt-2 text-sm text-slate-500">
                            From <span className="font-semibold text-slate-700">{schema.name}</span> where{' '}
                            {schema.primaryKeys.map(key => (
                                <span key={key} className="ml-1 whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{key} = {formatValue(deleteTarget[key] ?? null)}</span>
                            ))}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">If other rows reference this row, the database will reject the delete (no cascades).</p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" onClick={() => setDeleteTarget(null)}
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100">Cancel</button>
                            <button type="button" onClick={() => void handleDelete()}
                                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
