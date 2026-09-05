'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import type { AdminRow, AdminTableSchema } from '@/lib/db/admin'
import { createRowAction, foreignKeyOptionsAction, getReleaseArtistIdsAction, getReleaseComposerIdsAction, syncReleaseArtistsAction, syncReleaseComposersAction, updateRowAction } from './actions'
import { getFieldLabel, getFieldPlaceholder, sortColumnsByFieldOrder } from './fieldMetadata'
import { useI18n } from '@/lib/i18n/client'
import SearchableFkSelect from './SearchableFkSelect'
import MultiFkSelect from './MultiFkSelect'
import { Input } from '@/components/ui/input'
import CountrySelect from '@/components/ui/country-select'

type FkOptionPayload = {
    from: string
    targetTable: string
    targetColumn: string
    options: Array<{ value: string; label: string }>
}

function defaultValueOf(column: AdminTableSchema['columns'][number]) {
    if (column.defaultValue === null) return ''
    return column.defaultValue.replace(/^'(.*)'$/, '$1').replace(/^\"(.*)\"$/, '$1')
}

function isLongText(column: AdminTableSchema['columns'][number]) {
    return /(biograph|description|notes|summary|intro|abstract|text)/i.test(column.name) && /TEXT/i.test(column.type)
}

function isInternalField(column: AdminTableSchema['columns'][number], mode: 'create' | 'edit') {
    if (mode === 'create' && column.isRowIdAlias) return true
    if (mode === 'edit' && column.pkOrder > 0) return true
    if (/^(created_at|updated_at)$/i.test(column.name)) return true
    return false
}

const FK_TARGET_CREATABLE: Record<string, boolean> = {
    artists: true,
    composers: true,
    roles: true,
    catalogues: true,
    works: false,
    recordings: false,
    releases: false,
    tracklists: false,
}

export default function RowFormModal({ schema, mode, row, onClose, onSaved }: {
    schema: AdminTableSchema
    mode: 'create' | 'edit'
    row: AdminRow | null
    onClose: () => void
    onSaved: (message: string) => void
}) {
    const { t } = useI18n()
    const [values, setValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {}
        for (const column of schema.columns) {
            initial[column.name] = row ? String(row[column.name] ?? '') : defaultValueOf(column)
        }
        return initial
    })
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [fkOptions, setFkOptions] = useState<Record<string, FkOptionPayload>>({})
    const [showConfirmClose, setShowConfirmClose] = useState(false)
    const [dirty, setDirty] = useState(false)

    const isReleasesTable = schema.name === 'releases'
    const [releaseArtistIds, setReleaseArtistIds] = useState<string[]>([])
    const initialArtistIdsRef = useRef<string[]>([])
    const [artistOptions, setArtistOptions] = useState<Array<{ value: string; label: string }>>([])
    const [releaseComposerIds, setReleaseComposerIds] = useState<string[]>([])
    const initialComposerIdsRef = useRef<string[]>([])
    const [composerOptions, setComposerOptions] = useState<Array<{ value: string; label: string }>>([])

    const fkColumns = useMemo(() => schema.foreignKeys.map(fk => fk.from), [schema])
    const sortedColumns = useMemo(() => sortColumnsByFieldOrder(schema.name, schema.columns), [schema])

    // Track if form has been modified (ignore internal/hidden fields)
    useEffect(() => {
        const initial: Record<string, string> = {}
        for (const column of sortedColumns) {
            if (isInternalField(column, mode)) continue
            initial[column.name] = row ? String(row[column.name] ?? '') : defaultValueOf(column)
        }
        const hasFieldChanges = Object.keys(initial).some(key => values[key] !== initial[key])
        const hasArtistChanges = isReleasesTable && JSON.stringify([...releaseArtistIds].sort()) !== JSON.stringify([...initialArtistIdsRef.current].sort())
        const hasComposerChanges = isReleasesTable && JSON.stringify([...releaseComposerIds].sort()) !== JSON.stringify([...initialComposerIdsRef.current].sort())
        setDirty(hasFieldChanges || hasArtistChanges || hasComposerChanges)
    }, [values, sortedColumns, row, mode, isReleasesTable, releaseArtistIds, releaseComposerIds])

    useEffect(() => {
        let cancelled = false
        for (const column of fkColumns) {
            void (async () => {
                const result = await foreignKeyOptionsAction(schema.name, column)
                if (!cancelled && result.ok) {
                    setFkOptions(current => ({ ...current, [column]: result.data }))
                }
            })()
        }
        return () => { cancelled = true }
    }, [schema.name, fkColumns])

    // Load current release artists and artist options for the releases table
    useEffect(() => {
        if (!isReleasesTable) return
        let cancelled = false

        void (async () => {
            const result = await foreignKeyOptionsAction('release_artists', 'artist_id')
            if (!cancelled && result.ok) {
                setArtistOptions(result.data.options)
            }
        })()

        if (mode === 'edit' && row) {
            const releaseId = Number(row['release_id'])
            if (releaseId) {
                void (async () => {
                    const result = await getReleaseArtistIdsAction(releaseId)
                    if (!cancelled && result.ok) {
                        const ids = result.data.map(String)
                        setReleaseArtistIds(ids)
                        initialArtistIdsRef.current = ids
                    }
                })()
            }
        }

        return () => { cancelled = true }
    }, [isReleasesTable, mode, row])

    // Load current release composers and composer options for the releases table
    useEffect(() => {
        if (!isReleasesTable) return
        let cancelled = false

        void (async () => {
            const result = await foreignKeyOptionsAction('release_composers', 'artist_id')
            if (!cancelled && result.ok) {
                setComposerOptions(result.data.options)
            }
        })()

        if (mode === 'edit' && row) {
            const releaseId = Number(row['release_id'])
            if (releaseId) {
                void (async () => {
                    const result = await getReleaseComposerIdsAction(releaseId)
                    if (!cancelled && result.ok) {
                        const ids = result.data.map(String)
                        setReleaseComposerIds(ids)
                        initialComposerIdsRef.current = ids
                    }
                })()
            }
        }

        return () => { cancelled = true }
    }, [isReleasesTable, mode, row])

    // Close modal on Escape key (with confirmation if dirty)
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                if (dirty) {
                    setShowConfirmClose(true)
                } else {
                    onClose()
                }
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [onClose, dirty])

    function handleDialogClick(event: React.MouseEvent) {
        event.stopPropagation()
    }

    function handleConfirmClose() {
        setShowConfirmClose(false)
        onClose()
    }

    function handleCancelClose() {
        setShowConfirmClose(false)
    }

    function setValue(name: string, value: string) {
        setValues(current => ({ ...current, [name]: value }))
    }

    function handleFkOptionCreated(column: string, option: { value: string; label: string }) {
        setFkOptions(current => {
            const existing = current[column]
            if (!existing) return current
            return {
                ...current,
                [column]: {
                    ...existing,
                    options: [option, ...existing.options],
                },
            }
        })
    }

    function handleArtistOptionCreated(option: { value: string; label: string }) {
        setArtistOptions(current => [option, ...current])
    }

    function handleComposerOptionCreated(option: { value: string; label: string }) {
        setComposerOptions(current => [option, ...current])
    }

    async function submit() {
        if (!schema) return
        // Client-side NOT NULL validation (server double-checks).
        for (const column of sortedColumns) {
            if (isInternalField(column, mode)) continue
            if (column.notNull && !values[column.name]?.trim() && column.defaultValue === null) {
                setError(`Field "${getFieldLabel(schema.name, column.name)}" is required.`)
                return
            }
        }
        setSaving(true)
        setError(null)
        const payload: Record<string, string | null> = {}
        for (const column of sortedColumns) {
            if (isInternalField(column, mode)) continue
            const raw = values[column.name] ?? ''
            payload[column.name] = raw === '' ? null : raw
        }
        const result = mode === 'create'
            ? await createRowAction(schema.name, payload)
            : await updateRowAction(schema.name, Object.fromEntries(schema.primaryKeys.map(key => [key, String(row?.[key] ?? '')])), payload)
        if (!result.ok) {
            setSaving(false)
            setError(result.error)
            return
        }
        if (isReleasesTable) {
            const releaseId = mode === 'create'
                ? Number((result.data as { insertedPk: Record<string, number> }).insertedPk?.['release_id'])
                : Number(row?.['release_id'])
            if (releaseId) {
                const syncResult = await syncReleaseArtistsAction(releaseId, releaseArtistIds.map(Number))
                if (!syncResult.ok) {
                    setSaving(false)
                    setError(syncResult.error)
                    return
                }
                const syncComposersResult = await syncReleaseComposersAction(releaseId, releaseComposerIds.map(Number))
                if (!syncComposersResult.ok) {
                    setSaving(false)
                    setError(syncComposersResult.error)
                    return
                }
            }
        }
        setSaving(false)
        onSaved(mode === 'create' ? `Row inserted into ${schema.name}.` : `Row updated in ${schema.name}.`)
    }

    const inputClass = 'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100'

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={mode === 'create' ? 'Add row' : 'Edit row'}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-5"
        >
            <div
                className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-xl"
                onClick={handleDialogClick}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{schema.name}</p>
                        <h3 className="heading mt-1 text-lg font-semibold text-slate-900">
                            {mode === 'create' ? 'Add row' : 'Edit row'}
                        </h3>
                    </div>
                    <button type="button" onClick={() => dirty ? setShowConfirmClose(true) : onClose()}
                            className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100"
                            aria-label={t('common.close')}>
                        <X size={19} aria-hidden="true" />
                    </button>
                </div>

                {error && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        <span className="font-semibold">Error:</span>
                        <span className="min-w-0 flex-1 break-words">{error}</span>
                        <button type="button" onClick={() => setError(null)} aria-label="Dismiss" className="text-red-400 hover:text-red-600"><X size={14} /></button>
                    </div>
                )}

                <div className="mt-4 flex-1 overflow-y-auto">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {sortedColumns.map(column => {
                            if (isInternalField(column, mode)) return null

                            const fk = schema.foreignKeys.find(f => f.from === column.name)
                            const options = fk ? fkOptions[fk.from] : undefined
                            const showArtistsAfter = isReleasesTable && column.name === 'composer_id'

                            const labelElement = (
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700">
                                        {getFieldLabel(schema.name, column.name)}
                                        {column.notNull && !column.isRowIdAlias && <span className="ml-1 text-red-500">*</span>}
                                    </span>
                                    {options ? (
                                        <SearchableFkSelect
                                            value={values[column.name] ?? ''}
                                            onChange={v => setValue(column.name, v)}
                                            options={options.options}
                                            label={getFieldLabel(schema.name, column.name)}
                                            placeholder={`Search ${getFieldLabel(schema.name, column.name).toLowerCase()}…`}
                                            columnName={column.name}
                                            inputClass={inputClass}
                                            targetTable={fk?.table}
                                            allowCreate={fk ? !!FK_TARGET_CREATABLE[fk.table] : false}
                                            onOptionCreated={opt => handleFkOptionCreated(column.name, opt)}
                                        />
                                    ) : column.name === 'nationality' ? (
                                        <CountrySelect
                                            value={values[column.name] ?? ''}
                                            onChange={v => setValue(column.name, v)}
                                            placeholder="Select nationality…"
                                            className="mt-1.5"
                                        />
                                    ) : isLongText(column) ? (
                                        <textarea
                                            value={values[column.name] ?? ''}
                                            onChange={event => setValue(column.name, event.target.value)}
                                            rows={3}
                                            placeholder={getFieldPlaceholder(schema.name, column.name)}
                                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                                    ) : (
                                        <Input
                                            type={/REAL|FLOAT|DOUBLE|NUMERIC|DECIMAL/i.test(column.type) ? 'number' : /^(INTEGER|INT)/i.test(column.type) ? 'number' : 'text'}
                                            step="any"
                                            value={values[column.name] ?? ''}
                                            onChange={event => setValue(column.name, event.target.value)}
                                            placeholder={getFieldPlaceholder(schema.name, column.name)}
                                            className="mt-1.5 h-10 rounded-xl border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                                    )}
                                </label>
                            )

                            if (showArtistsAfter) {
                                return (
                                    <Fragment key={column.name}>
                                        <div className="sm:col-span-2">{labelElement}</div>
                                        <div className="sm:col-span-2 block">
                                            <span className="text-sm font-medium text-slate-700">Composers</span>
                                            <MultiFkSelect
                                                value={releaseComposerIds}
                                                onChange={setReleaseComposerIds}
                                                options={composerOptions}
                                                placeholder="Search composers…"
                                                targetTable="artists"
                                                allowCreate
                                                onOptionCreated={handleComposerOptionCreated}
                                            />
                                        </div>
                                        <div className="sm:col-span-2 block">
                                            <span className="text-sm font-medium text-slate-700">Artists</span>
                                            <MultiFkSelect
                                                value={releaseArtistIds}
                                                onChange={setReleaseArtistIds}
                                                options={artistOptions}
                                                placeholder="Search artists…"
                                                targetTable="artists"
                                                allowCreate
                                                onOptionCreated={handleArtistOptionCreated}
                                            />
                                        </div>
                                    </Fragment>
                                )
                            }

                            return <div key={column.name}>{labelElement}</div>
                        })}
                    </div>

                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={() => dirty ? setShowConfirmClose(true) : onClose()}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100">Cancel</button>
                    <button type="button" onClick={() => void submit()} disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-60">
                        {saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                        {mode === 'create' ? 'Insert row' : 'Save changes'}
                    </button>
                </div>
            </div>

            {/* Confirmation dialog for closing with unsaved changes */}
            {showConfirmClose && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Discard changes"
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-5"
                    onClick={handleCancelClose}
                >
                    <div
                        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                                <AlertTriangle size={20} className="text-amber-600" />
                            </div>
                            <h3 className="heading text-lg font-semibold text-slate-900">Discard changes?</h3>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                            You have unsaved changes. Are you sure you want to close this form? Your changes will be lost.
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" onClick={handleCancelClose}
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100">
                                Keep editing
                            </button>
                            <button type="button" onClick={handleConfirmClose}
                                    className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-200">
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/** The label column used by the server (name → title → first TEXT). Reflected back for transparency. */
function guessLabelColumn(options: FkOptionPayload) {
    return options.targetColumn
}
