'use client'

import {useState} from 'react'
import type {Work} from '@/lib/db/works'
import {useI18n} from '@/lib/i18n/client'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
} from '@/components/ui/pagination'

const PAGE_SIZE = 10

/** Minimal row shape shared by Works (works page) and ArtistWork (artist detail). */
type PaginatedWork = Pick<Work, 'workId' | 'catalogue' | 'title' | 'type' | 'key'>

/** Paginated works table for the artist detail page. */
export default function WorksTable({works}: { works: PaginatedWork[] }) {
    const {t} = useI18n()
    const [page, setPage] = useState(1)
    const totalPages = Math.max(1, Math.ceil(works.length / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)
    const rows = works.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    const blankRows = PAGE_SIZE - rows.length

    function goTo(target: number) {
        setPage(Math.min(Math.max(1, target), totalPages))
    }

    return <>
        {works.length > PAGE_SIZE && (
            <div className="mb-3 flex items-center justify-end">
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
        <div className="overflow-x-auto">
            <table className="table-fixed w-full text-left text-sm">
                <thead
                    className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                    <th className="w-[80px] px-5 py-4">{t('works.catalogue')}</th>
                    <th className="w-[320px] px-4 py-4">{t('works.titleColumn')}</th>
                    <th className="w-[120px] px-4 py-4">{t('works.type')}</th>
                    <th className="w-[120px] px-4 py-4">{t('works.key')}</th>
                </tr>
                </thead>
                <tbody>{rows.map(work => <tr key={work.workId}
                                             className="border-b border-slate-100 last:border-0 hover:bg-blue-50/50">
                    <td className="px-5 py-4 font-semibold text-blue-700">{work.catalogue || '—'}</td>
                    <td className="truncate px-4 py-4 font-medium text-slate-900" title={work.title}>{work.title}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{work.type || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{work.key || '—'}</td>
                </tr>)}{Array.from({length: blankRows}).map((_, index) => <tr key={`blank-${index}`} aria-hidden="true"
                                                                              className="border-b border-slate-100 last:border-0"><td
                    colSpan={4} className="px-5 py-4">&nbsp;</td></tr>)}</tbody>
            </table>
        </div>
    </>
}
