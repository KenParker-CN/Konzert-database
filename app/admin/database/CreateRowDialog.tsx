'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import type { AdminTableSchema } from '@/lib/db/admin'
import { createRowAction, getSchemaAction } from './actions'
import { getFieldLabel, getFieldPlaceholder } from './fieldMetadata'
import { getTableLabel } from './tableMetadata'

type CreateRowDialogProps = {
    tableName: string
    initialName?: string
    onCreated: (id: number, label: string) => void
    onClose: () => void
}

const inputClass = 'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

const LABEL_CANDIDATES = ['name', 'title', 'code', 'role']

function findLabelColumn(columns: Array<{ name: string }>): string | undefined {
    for (const candidate of LABEL_CANDIDATES) {
        const found = columns.find(c => c.name === candidate)
        if (found) return found.name
    }
    return undefined
}

export default function CreateRowDialog({ tableName, initialName, onCreated, onClose }: CreateRowDialogProps) {
    const [schema, setSchema] = useState<AdminTableSchema | null>(null)
    const [values, setValues] = useState<Record<string, string>>({})
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const formColumns = useMemo(() => {
        if (!schema) return []
        const fkColumns = new Set(schema.foreignKeys.map(fk => fk.from))
        return schema.columns.filter(col => {
            if (fkColumns.has(col.name)) return false
            if (col.isRowIdAlias) return false
            if (/^(created_at|updated_at)$/i.test(col.name)) return false
            return true
        })
    }, [schema])

    const labelColumn = useMemo(() => {
        if (!schema) return undefined
        return findLabelColumn(formColumns)
    }, [schema, formColumns])

    useEffect(() => {
        let cancelled = false
        void (async () => {
            const result = await getSchemaAction(tableName)
            if (!cancelled && result.ok) {
                setSchema(result.data)
                const initial: Record<string, string> = {}
                for (const col of result.data.columns) {
                    if (col.defaultValue !== null && !col.isRowIdAlias) {
                        initial[col.name] = col.defaultValue.replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1')
                    }
                }
                if (initialName) {
                    const labelCol = findLabelColumn(
                        result.data.columns.filter(c =>
                            !result.data.foreignKeys.some(fk => fk.from === c.name) &&
                            !c.isRowIdAlias &&
                            !/^(created_at|updated_at)$/i.test(c.name)
                        )
                    )
                    if (labelCol) initial[labelCol] = initialName
                }
                if (!cancelled) setValues(initial)
            }
        })()
        return () => { cancelled = true }
    }, [tableName, initialName])

    useEffect(() => {
        if (!schema) return
        const timer = setTimeout(() => {
            const firstInput = document.querySelector<HTMLInputElement>(
                '[data-create-row-dialog] input:not([type="hidden"])'
            )
            firstInput?.focus()
        }, 100)
        return () => clearTimeout(timer)
    }, [schema])

    async function handleSubmit() {
        if (!schema || formColumns.length === 0) return

        for (const col of formColumns) {
            if (col.notNull && !values[col.name]?.trim() && col.defaultValue === null) {
                setError(`Field "${getFieldLabel(tableName, col.name)}" is required.`)
                return
            }
        }

        setSaving(true)
        setError(null)

        const payload: Record<string, string | null> = {}
        for (const col of schema.columns) {
            if (col.isRowIdAlias) continue
            const fk = schema.foreignKeys.find(f => f.from === col.name)
            if (fk) continue
            if (/^(created_at|updated_at)$/i.test(col.name)) continue
            const raw = values[col.name] ?? ''
            payload[col.name] = raw.trim() === '' ? null : raw
        }

        const result = await createRowAction(tableName, payload)
        setSaving(false)

        if (result.ok) {
            const pkValue = Object.values(result.data.insertedPk)[0]
            const id = Number(pkValue)
            const label = labelColumn ? (values[labelColumn]?.trim() || initialName || '') : (initialName || '')
            onCreated(id, label)
        } else {
            setError(result.error)
        }
    }

    const tableLabel = getTableLabel(tableName)

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`Create new ${tableLabel.toLowerCase()}`}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-5"
        >
            <div
                data-create-row-dialog
                className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-xl"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">New {tableLabel}</p>
                        <h3 className="heading mt-1 text-lg font-semibold text-slate-900">Create {tableLabel}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                        aria-label="Close"
                    >
                        <X size={19} />
                    </button>
                </div>

                {error && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        <span className="font-semibold">Error:</span>
                        <span className="min-w-0 flex-1 break-words">{error}</span>
                        <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                            <X size={14} />
                        </button>
                    </div>
                )}

                {!schema ? (
                    <div className="mt-6 flex items-center justify-center py-8">
                        <Loader2 size={20} className="animate-spin text-slate-400" />
                    </div>
                ) : formColumns.length === 0 ? (
                    <p className="mt-6 py-8 text-center text-sm text-slate-500">
                        This table has no editable fields for quick creation.
                    </p>
                ) : (
                    <div className="mt-4 flex-1 overflow-y-auto">
                        <div className="grid gap-4">
                            {formColumns.map(col => (
                                <label key={col.name} className="block">
                                    <span className="text-sm font-medium text-slate-700">
                                        {getFieldLabel(tableName, col.name)}
                                        {col.notNull && !col.isRowIdAlias && <span className="ml-1 text-red-500">*</span>}
                                    </span>
                                    <input
                                        type={/REAL|FLOAT|DOUBLE|NUMERIC|DECIMAL/i.test(col.type) ? 'number' : /^(INTEGER|INT)/i.test(col.type) ? 'number' : 'text'}
                                        step={/REAL|FLOAT|DOUBLE|NUMERIC|DECIMAL/i.test(col.type) ? 'any' : undefined}
                                        value={values[col.name] ?? ''}
                                        onChange={e => setValues(prev => ({ ...prev, [col.name]: e.target.value }))}
                                        placeholder={getFieldPlaceholder(tableName, col.name)}
                                        className={`${inputClass} mt-1.5`}
                                        autoFocus={col === formColumns[0]}
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => void handleSubmit()}
                        disabled={saving || !schema || formColumns.length === 0}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {saving && <Loader2 size={15} className="animate-spin" />}
                        Create
                    </button>
                </div>
            </div>
        </div>
    )
}
