'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Play,
    X,
} from 'lucide-react'
import { executeSqlAction, type SqlExecResult } from './actions'
import { toast as showToast } from '@/components/ui/toast'
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupText,
    InputGroupTextarea,
} from '@/components/ui/input-group'

type ResultState =
    | { status: 'idle' }
    | { status: 'confirming'; sql: string }
    | { status: 'executing' }
    | { status: 'result'; data: Exclude<SqlExecResult, { ok: false }> }

export default function SqlConsole() {
    const [sql, setSql] = useState('')
    const [state, setState] = useState<ResultState>({ status: 'idle' })
    const [history, setHistory] = useState<string[]>([])
    const [showHistory, setShowHistory] = useState(false)
    const [cursorPos, setCursorPos] = useState({ row: 1, col: 1 })
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const updateCursorPos = useCallback(() => {
        const ta = textareaRef.current
        if (!ta) return
        const pos = ta.selectionStart
        const textBefore = ta.value.substring(0, pos)
        const lines = textBefore.split('\n')
        setCursorPos({ row: lines.length, col: lines[lines.length - 1].length + 1 })
    }, [])

    useEffect(() => {
        const ta = textareaRef.current
        if (!ta) return
        ta.addEventListener('click', updateCursorPos)
        ta.addEventListener('keyup', updateCursorPos)
        ta.addEventListener('select', updateCursorPos)
        return () => {
            ta.removeEventListener('click', updateCursorPos)
            ta.removeEventListener('keyup', updateCursorPos)
            ta.removeEventListener('select', updateCursorPos)
        }
    }, [updateCursorPos])

    useEffect(() => {
        updateCursorPos()
    }, [sql, updateCursorPos])

    const handleExecute = useCallback(async (sqlToRun: string, confirmed: boolean) => {
        const trimmed = sqlToRun.trim()
        if (!trimmed) return

        setState({ status: 'executing' })
        const result = await executeSqlAction(trimmed, confirmed)

        if (!result.ok) {
            showToast.add({ description: result.error, type: 'error' })
            setState({ status: 'idle' })
            return
        }

        if (result.type === 'needs_confirm') {
            setState({ status: 'confirming', sql: result.sql })
            return
        }

        if (result.type === 'write') {
            showToast.add({ description: `${result.changes} row${result.changes !== 1 ? 's' : ''} affected`, type: 'success' })
            setState({ status: 'idle' })
        } else {
            setState({ status: 'result', data: result })
        }
        setHistory(prev => {
            const next = [trimmed, ...prev.filter(s => s !== trimmed)]
            return next.slice(0, 20)
        })
    }, [])

    const handleSubmit = useCallback(() => {
        void handleExecute(sql, false)
    }, [sql, handleExecute])

    const handleConfirm = useCallback(() => {
        if (state.status !== 'confirming') return
        void handleExecute(state.sql, true)
    }, [state, handleExecute])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
        }
    }, [handleSubmit])

    const handleHistorySelect = useCallback((entry: string) => {
        setSql(entry)
        setShowHistory(false)
        textareaRef.current?.focus()
    }, [])

    return (
        <div className="mx-auto max-w-6xl">
            {/* History toggle */}
            {history.length > 0 && (
                <div className="mb-4 flex justify-end">
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    >
                        History ({history.length})
                        {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            )}

            {/* History dropdown */}
            {showHistory && history.length > 0 && (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent queries</p>
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                        {history.map((entry, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleHistorySelect(entry)}
                                className="block w-full truncate rounded-lg px-3 py-2 text-left font-mono text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                            >
                                {entry}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Vertical layout: Editor + Results */}
            <div className="space-y-6">
                {/* SQL Editor */}
                <section>
                    <InputGroup className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-sm has-disabled:bg-white has-disabled:opacity-100">
                        <InputGroupAddon align="block-start" className="border-b border-slate-200 bg-slate-50">
                            <InputGroupText className="font-mono text-sm font-semibold text-blue-600">
                                SQL
                            </InputGroupText>
                            {sql && (
                                <InputGroupButton
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => setSql('')}
                                    aria-label="Clear"
                                    className="text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </InputGroupButton>
                            )}
                        </InputGroupAddon>
                        <InputGroupTextarea
                            ref={textareaRef}
                            id="sql-input"
                            value={sql}
                            onChange={e => setSql(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="SELECT * FROM artists LIMIT 10;"
                            className="min-h-[300px] bg-white font-mono text-sm text-slate-800 placeholder:text-slate-400"
                            spellCheck={false}
                            autoComplete="off"
                        />
                        <InputGroupAddon align="block-end" className="border-t border-slate-200 bg-slate-50">
                            <InputGroupText className="font-mono text-xs tabular-nums text-slate-400">
                                Ln {cursorPos.row}, Col {cursorPos.col}
                            </InputGroupText>
                            <InputGroupButton
                                size="sm"
                                variant="default"
                                className="ml-auto bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400"
                                onClick={handleSubmit}
                                disabled={!sql.trim() || state.status === 'executing'}
                            >
                                <Play size={14} aria-hidden="true" />
                                Execute
                            </InputGroupButton>
                        </InputGroupAddon>
                    </InputGroup>
                </section>

                {/* Results Panel */}
                <section>
                    <ResultPanel state={state} />
                </section>
            </div>

            {/* Confirmation Dialog */}
            {state.status === 'confirming' && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Confirm SQL execution"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-5"
                    onClick={() => setState({ status: 'idle' })}
                >
                    <div
                        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                                <AlertTriangle size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h3 className="heading text-lg font-semibold text-slate-900">
                                    Destructive operation
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    This SQL will modify data in the database. The operation runs inside a transaction and will roll back on error.
                                </p>
                            </div>
                        </div>
                        <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-800">
                            {state.sql}
                        </pre>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setState({ status: 'idle' })}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200"
                            >
                                <AlertTriangle size={14} aria-hidden="true" />
                                Execute anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

function ResultPanel({ state }: { state: ResultState }) {
    if (state.status === 'idle') {
        return (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <p className="text-sm text-slate-400">Run a query to see results</p>
            </div>
        )
    }

    if (state.status === 'executing') {
        return (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
                    Executing...
                </div>
            </div>
        )
    }

    if (state.status === 'confirming') {
        return (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white">
                <p className="text-sm text-slate-400">Awaiting confirmation...</p>
            </div>
        )
    }

    return <ResultDisplay data={state.data} />
}

function ResultDisplay({ data }: { data: Exclude<SqlExecResult, { ok: false }> }) {
    if (data.type === 'empty') {
        return (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                No SQL to execute.
            </div>
        )
    }

    if (data.type === 'select') {
        if (data.rows.length === 0) {
            return (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                    Query returned 0 rows.
                </div>
            )
        }

        return (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3">
                    <span className="text-sm font-semibold text-slate-700">
                        {data.rows.length} row{data.rows.length !== 1 ? 's' : ''} returned
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                        ({data.columns.length} column{data.columns.length !== 1 ? 's' : ''})
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max border-collapse text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                {data.columns.map(col => (
                                    <th key={col} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.rows.map((row, i) => (
                                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-blue-50/50">
                                    {data.columns.map(col => (
                                        <td key={col} className="max-w-[300px] truncate px-3 py-2 text-slate-700">
                                            {row[col] === null
                                                ? <span className="italic text-slate-400">NULL</span>
                                                : String(row[col])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return null
}
