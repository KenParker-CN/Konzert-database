'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Check, Database } from 'lucide-react'
import {
    CATEGORY_META,
    getTableGroup,
    getTableLabel,
    getTableOrder,
    type TableGroup,
} from './tableMetadata'

interface BreadcrumbNavProps {
    tables: string[]
    items: Array<
        | { type: 'link'; href: string; label: string }
        | { type: 'static'; label: string }
    >
    categoryGroup?: TableGroup | null
    currentTable?: string | null
}

export default function BreadcrumbNav({ tables, items, categoryGroup, currentTable }: BreadcrumbNavProps) {
    const router = useRouter()

    const levelColors = ['text-blue-600', 'text-violet-600', 'text-emerald-600']
    const levelHoverBg = ['hover:bg-blue-50 hover:text-blue-700', 'hover:bg-violet-50 hover:text-violet-700', 'hover:bg-emerald-50 hover:text-emerald-700']

    return (
        <nav className="flex min-w-0 items-center gap-1.5" aria-label="Breadcrumb">
            {items.map((item, index) => {
                const isLast = index === items.length - 1
                const showCategoryPopover = !isLast && index === 1 && !!categoryGroup
                const levelColor = levelColors[index] ?? levelColors[levelColors.length - 1]
                const levelHover = levelHoverBg[index] ?? levelHoverBg[levelHoverBg.length - 1]

                return (
                    <div key={index} className="flex items-center gap-1.5">
                        {index > 0 && <ChevronRight size={14} className={`shrink-0 opacity-50 ${levelColors[index - 1] ?? levelColors[0]}`} aria-hidden="true" />}
                        {showCategoryPopover && categoryGroup ? (
                            <CategoryPopoverTrigger
                                group={categoryGroup}
                                tables={tables}
                                currentTable={currentTable ?? null}
                                router={router}
                                levelColor={levelColor}
                                levelHover={levelHover}
                            />
                        ) : item.type === 'link' ? (
                            <a
                                href={item.href}
                                onClick={e => { e.preventDefault(); router.push(item.href) }}
                                className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-2 py-1 text-sm font-medium ${levelColor} transition-colors ${levelHover}`}
                            >
                                {index === 0 && <Database size={14} aria-hidden="true" />}
                                {item.label}
                            </a>
                        ) : (
                            <span className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-2 py-1 text-sm font-medium ${levelColor}`}>
                                {index === 0 && <Database size={14} aria-hidden="true" />}
                                {item.label}
                            </span>
                        )}
                    </div>
                )
            })}
        </nav>
    )
}

function CategoryPopoverTrigger({
    group,
    tables,
    currentTable,
    router,
    levelColor,
    levelHover,
}: {
    group: TableGroup
    tables: string[]
    currentTable: string | null
    router: ReturnType<typeof useRouter>
    levelColor: string
    levelHover: string
}) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const meta = CATEGORY_META[group as keyof typeof CATEGORY_META]
    const label = meta?.label ?? group

    const categoryTables = useMemo(
        () => tables
            .filter(t => getTableGroup(t) === group)
            .sort((a, b) => getTableOrder(a) - getTableOrder(b)),
        [tables, group],
    )

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-2 py-1 text-sm font-medium ${levelColor} transition-colors ${levelHover}`}
                aria-haspopup="true"
                aria-expanded={open}
            >
                <span className="truncate">{label}</span>
                <ChevronDown size={14} className={`shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-2xl border border-slate-200 bg-white py-1.5 shadow-lg">
                    <a
                        href={`/admin/database/${meta.slug}`}
                        onClick={e => { e.preventDefault(); setOpen(false); router.push(`/admin/database/${meta.slug}`) }}
                        className="block px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    >
                        {label} overview
                    </a>
                    <div className="mx-2 my-1 border-t border-slate-100" />
                    {categoryTables.map(table => {
                        const tableLabel = getTableLabel(table)
                        const isActive = table === currentTable
                        return (
                            <button
                                key={table}
                                type="button"
                                onClick={() => { setOpen(false); router.push(`/admin/database/${meta.slug}/${table}`) }}
                                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                                    isActive ? 'bg-violet-50 font-medium text-violet-700' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <span className="flex-1 truncate">{tableLabel}</span>
                                {isActive && <Check size={14} className="shrink-0 text-violet-600" />}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

