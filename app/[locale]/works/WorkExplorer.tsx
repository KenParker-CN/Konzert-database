'use client'

import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { KeyboardEvent, useMemo, useRef, useState, useTransition } from 'react'
import type { Work, WorkFilterOptions } from '../../../lib/db/works'
import { useI18n } from '../../../lib/i18n/client'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
} from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectPortal, SelectPositioner, SelectPopup, SelectItem } from '@/components/ui/select'

const PAGE_SIZES = [10, 25, 50, 100]

const fields = ['catalogue', 'type', 'key', 'instrumentation'] as const

const columnLabels: Record<string, string> = {
    catalogue: 'works.catalogue',
    number: 'works.number',
    title: 'works.titleColumn',
    composer: 'works.composer',
    type: 'works.type',
    key: 'works.key',
    instrumentation: 'works.instrumentation',
}

const columns = ['catalogue', 'title', 'composer', 'type', 'key', 'instrumentation'] as const

export default function WorkExplorer({ works, options }: { works: Work[]; options: WorkFilterOptions }) {
    const { t } = useI18n()
    const router = useRouter()
    const pathname = usePathname()
    const params = useSearchParams()
    const query = params ?? new URLSearchParams()
    const [isPending, startTransition] = useTransition()
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const totalPages = Math.max(1, Math.ceil(works.length / pageSize))
    const currentPage = Math.min(page, totalPages)
    const pageWorks = useMemo(
        () => works.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [works, currentPage, pageSize],
    )
    const blankRows = works.length ? pageSize - pageWorks.length : 0

    function goTo(target: number) {
        setPage(Math.min(Math.max(1, target), totalPages))
    }

    function handlePageSizeChange(value: string) {
        const newSize = Number(value)
        setPageSize(newSize)
        setPage(1)
    }

    const searchRef = useRef<HTMLInputElement>(null)
    const [filters, setFilters] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {}
        for (const f of fields) init[f] = query.get(f) ?? ''
        return init
    })

    function buildUrl(override?: Record<string, string>) {
        const next = new URLSearchParams()
        const search = (searchRef.current?.value ?? '').trim()
        if (search) next.set('search', search)
        const activeFilters = override ?? filters
        for (const key of fields) {
            const value = (activeFilters[key] ?? '').trim()
            if (value) next.set(key, value)
        }
        return next.toString() ? `?${next}` : ''
    }

    function navigate(override?: Record<string, string>) {
        setPage(1)
        startTransition(() => router.push(`${pathname}${buildUrl(override)}`))
    }

    function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault()
            navigate()
        }
    }

    const countLabel = works.length === 1
        ? t('works.count_one', { count: works.length })
        : t('works.count', { count: works.length })

    return <>
        <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {fields.map(field => (
                <Select key={field} value={filters[field]} onValueChange={v => {
                    const newVal = v ?? ''
                    setFilters(prev => ({ ...prev, [field]: newVal }))
                    navigate({ ...filters, [field]: newVal })
                }}>
                    <SelectTrigger className="h-10 flex-1 rounded-xl border-slate-200 bg-slate-50 text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 [&>span]:truncate">
                        <SelectValue placeholder={t(columnLabels[field])} />
                    </SelectTrigger>
                    <SelectPortal>
                        <SelectPositioner>
                            <SelectPopup>
                                <SelectItem value="" className="rounded-lg px-3 py-2 text-sm">
                                    {t(columnLabels[field])}
                                </SelectItem>
                                {[...(options[field] ?? [])].sort().map(value => (
                                    <SelectItem key={value} value={value} className="rounded-lg px-3 py-2 text-sm">
                                        {value}
                                    </SelectItem>
                                ))}
                            </SelectPopup>
                        </SelectPositioner>
                    </SelectPortal>
                </Select>
            ))}
            <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400"><Search size={16} aria-hidden="true" /></span>
                <Input ref={searchRef} defaultValue={query.get('search') ?? ''} placeholder={t('works.searchPlaceholder')}
                       onKeyDown={handleSearchKeyDown}
                       className="h-10 w-full rounded-xl border-slate-200 bg-slate-50 pl-9 pr-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
            <div className="text-sm text-slate-500">{isPending ? t('works.updating') : countLabel}</div>
            {works.length > 1 && (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="page-size" className="text-sm font-medium text-slate-700">
                            {t('works.rowsPerPage')}
                        </label>
                        <select
                            id="page-size"
                            value={pageSize}
                            onChange={e => handlePageSizeChange(e.target.value)}
                            className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                            {PAGE_SIZES.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                    <Pagination className="mx-0 w-auto">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    disabled={currentPage <= 1}
                                    onClick={() => goTo(currentPage - 1)}
                                />
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationNext
                                    disabled={currentPage >= totalPages}
                                    onClick={() => goTo(currentPage + 1)}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="table-fixed w-full border-collapse text-sm">
                    <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{columns.map(key => (
                        <th key={key} className={key === 'title' ? 'w-[180px] px-4 py-4 font-semibold' : key === 'instrumentation' ? 'w-[360px] px-4 py-4 font-semibold' : key === 'catalogue' ? 'w-[160px] text-center sticky left-0 z-10 bg-slate-50 px-5 py-4 font-semibold' : key === 'composer' ? 'w-[160px] px-4 py-4 text-center font-semibold' : key === 'type' ? 'w-[100px] px-4 py-4 text-center font-semibold' : 'w-[100px] px-4 py-4 text-center font-semibold'}>
                            {key === 'catalogue' ? 'CATA# / #' : t(columnLabels[key])}
                        </th>
                    ))}</tr></thead>
                    <tbody>{pageWorks.map(work => <tr key={work.workId} className="group border-b border-slate-100 last:border-0 hover:bg-blue-50/50"><td className="w-[160px] text-center whitespace-nowrap sticky left-0 bg-white px-5 py-4 font-semibold text-blue-700 group-hover:bg-blue-50/50">{work.catalogue && work.number ? `${work.catalogue}. ${work.number}` : work.catalogue || work.number || '—'}</td><td className="truncate px-4 py-4 font-medium text-slate-900" title={work.title}>{work.title}</td><td className="whitespace-nowrap px-4 py-4 text-center text-slate-700">{work.composer}</td><td className="whitespace-nowrap px-4 py-4 text-center text-slate-600">{work.type || '—'}</td><td className="whitespace-nowrap px-4 py-4 text-center text-slate-600">{work.key || '—'}</td><td className="truncate px-4 py-4 text-slate-600" title={work.instrumentation || ''}>{work.instrumentation || '—'}</td></tr>)}{Array.from({ length: blankRows }).map((_, index) => <tr key={`blank-${index}`} aria-hidden="true" className="border-b border-slate-100 last:border-0"><td colSpan={6} className="px-5 py-4">&nbsp;</td></tr>)}</tbody>
                </table>
            </div>
            {!works.length && <div className="px-6 py-14 text-center text-sm text-slate-500">{t('works.noWorks')}</div>}
        </div>
    </>
}