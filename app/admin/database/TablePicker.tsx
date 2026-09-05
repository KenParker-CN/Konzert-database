'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { groupedTables, type GroupedTable } from './tableMetadata'

interface TablePickerProps {
    tables: string[]
    value: string
    onChange: (name: string) => void
    disabled?: boolean
}

function flattenItems(groups: ReturnType<typeof groupedTables>): GroupedTable[] {
    return groups.flatMap(g => g.items)
}

export default function TablePicker({ tables, value, onChange, disabled }: TablePickerProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    const groups = useMemo(() => groupedTables(tables), [tables])
    const allItems = useMemo(() => flattenItems(groups), [groups])

    const filtered = useMemo(() => {
        if (!search.trim()) return groups
        const q = search.trim().toLowerCase()
        return groups
            .map(group => ({
                ...group,
                items: group.items.filter(
                    item => item.label.toLowerCase().includes(q) || item.name.toLowerCase().includes(q),
                ),
            }))
            .filter(group => group.items.length > 0)
    }, [groups, search])

    const filteredItems = useMemo(() => flattenItems(filtered), [filtered])

    useEffect(() => {
        setActiveIndex(0)
    }, [search])

    useEffect(() => {
        if (!open) return
        const handleMouseDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
                setSearch('')
            }
        }
        document.addEventListener('mousedown', handleMouseDown)
        return () => document.removeEventListener('mousedown', handleMouseDown)
    }, [open])

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus()
        }
    }, [open])

    useEffect(() => {
        if (!listRef.current) return
        const active = listRef.current.querySelector('[data-active="true"]')
        if (active) {
            active.scrollIntoView({ block: 'nearest' })
        }
    }, [activeIndex])

    const selectItem = useCallback((name: string) => {
        onChange(name)
        setOpen(false)
        setSearch('')
    }, [onChange])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex(i => Math.min(i + 1, filteredItems.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex(i => Math.max(i - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (filteredItems[activeIndex]) {
                selectItem(filteredItems[activeIndex].name)
            }
        } else if (e.key === 'Escape') {
            e.preventDefault()
            setOpen(false)
            setSearch('')
        }
    }, [filteredItems, activeIndex, selectItem])

    const currentLabel = useMemo(() => {
        const item = allItems.find(i => i.name === value)
        return item?.label ?? value
    }, [allItems, value])

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(prev => !prev)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-emerald-600 outline-none transition-colors hover:bg-emerald-50 hover:text-emerald-700 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="truncate">{currentLabel}</span>
                <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    className="absolute left-0 top-full z-50 mt-2 w-full min-w-[280px] rounded-2xl border border-slate-200 bg-white shadow-lg sm:w-auto sm:min-w-[320px]"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Select a table"
                    onKeyDown={handleKeyDown}
                >
                    <div className="border-b border-slate-100 p-2">
                        <label className="relative">
                            <span className="sr-only">Search tables</span>
                            <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
                                <Search size={16} aria-hidden="true" />
                            </span>
                            <input
                                ref={inputRef}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search tables…"
                                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-2 rounded-md p-0.5 text-slate-400 hover:text-slate-600"
                                    aria-label="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </label>
                    </div>

                    <div ref={listRef} className="max-h-[320px] overflow-y-auto p-1.5" role="listbox">
                        {filtered.length === 0 && (
                            <p className="px-3 py-6 text-center text-sm text-slate-400">No tables match "{search}"</p>
                        )}
                        {filtered.map(group => (
                            <div key={group.group} className="mb-1">
                                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    {group.groupLabel}
                                </div>
                                {group.items.map(item => {
                                    const idx = filteredItems.findIndex(i => i.name === item.name)
                                    const isSelected = item.name === value
                                    const isActive = idx === activeIndex
                                    return (
                                        <button
                                            key={item.name}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            data-active={isActive}
                                            onClick={() => selectItem(item.name)}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                                isSelected
                                                    ? 'bg-emerald-50 font-medium text-emerald-700'
                                                    : isActive
                                                        ? 'bg-slate-50 text-slate-800'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="flex-1 truncate">{item.label}</span>
                                            {item.label !== item.name && (
                                                <span className="shrink-0 text-[11px] text-slate-400">{item.name}</span>
                                            )}
                                            {isSelected && (
                                                <Check size={14} className="shrink-0 text-emerald-600" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
