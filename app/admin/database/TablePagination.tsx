'use client'

import { Fragment } from 'react'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationButton,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from '@/components/ui/pagination'

interface TablePaginationProps {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
}

export function PageCountText({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
    return (
        <span className="whitespace-nowrap text-sm text-slate-500">
            {total === 0 ? '0 rows' : `${Math.min(pageSize, total - (page - 1) * pageSize)} of ${total}`}
        </span>
    )
}

export function PageButtons({ page, pageSize, total, onPageChange }: TablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))} />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter(candidate => candidate === 1 || candidate === totalPages || Math.abs(candidate - page) <= 1)
                    .map((candidate, index, list) => (
                        <Fragment key={candidate}>
                            {index > 0 && candidate - list[index - 1] > 1 && (
                                <PaginationItem><PaginationEllipsis /></PaginationItem>
                            )}
                            <PaginationItem>
                                <PaginationButton isActive={candidate === page} onClick={() => onPageChange(candidate)}>
                                    {candidate}
                                </PaginationButton>
                            </PaginationItem>
                        </Fragment>
                    ))}
                <PaginationItem>
                    <PaginationNext disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))} />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    )
}

export default function TablePagination({ page, pageSize, total, onPageChange }: TablePaginationProps) {
    return (
        <div className="flex items-center gap-3 text-sm text-slate-500">
            <PageCountText page={page} pageSize={pageSize} total={total} />
            <PageButtons page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
        </div>
    )
}
