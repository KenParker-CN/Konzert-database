'use client'

import {useMemo, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious} from '@/components/ui/pagination'
import WorksTable from '@/components/catalogues/WorksTable'
import type {ComposerWork} from '@/lib/db/composers'
import {useI18n} from '@/lib/i18n/client'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectPositioner, SelectTrigger, SelectValue} from '@/components/ui/select'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import {compareWorkKeys, normalizeWorkKey} from '@/lib/i18n/work-keys'
import {IconSearch, IconX} from '@tabler/icons-react'

const PAGE_SIZE = 50

function normalizeSearchText(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim()
}

function compareWorksBySort(left: ComposerWork, right: ComposerWork): number {
    const leftSort = left.sort.trim()
    const rightSort = right.sort.trim()
    const leftNumber = Number(leftSort)
    const rightNumber = Number(rightSort)
    const bothNumeric = leftSort !== '' && rightSort !== '' && Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
    const leftIsAnh = /\bAnh\b/i.test(leftSort)
    const rightIsAnh = /\bAnh\b/i.test(rightSort)

    if (leftIsAnh !== rightIsAnh) return leftIsAnh ? 1 : -1
    if (!leftSort && rightSort) return 1
    if (leftSort && !rightSort) return -1
    return (bothNumeric
        ? leftNumber - rightNumber
        : leftSort.localeCompare(rightSort, undefined, {numeric: true, sensitivity: 'base'}))
        || left.workId - right.workId
}

function compareWorksByDate(left: ComposerWork, right: ComposerWork): number {
    if (left.date === right.date) return left.workId - right.workId
    return left.date < right.date ? -1 : 1
}

function getPageItems(current: number, total: number): (number | 'ellipsis')[] {
    const pages = [1, total, current - 1, current, current + 1]
        .filter(page => page >= 1 && page <= total)
    const sorted = [...new Set(pages)].sort((left, right) => left - right)
    return sorted.flatMap((page, index) => {
        const previous = sorted[index - 1]
        return previous !== undefined && page - previous > 1 ? ['ellipsis' as const, page] : [page]
    })
}

function filterWorksByGenre(works: ComposerWork[], genre: string) {
    if (!genre) return works
    return works.filter(work => work.genre === genre)
}

export default function WorksBrowser({
    allWorks,
    catalogCode,
}: {
    allWorks: ComposerWork[]
    catalogCode: string
}) {
    const {t, locale} = useI18n()
    const showDateColumn = allWorks.every(work => !work.catalogue && !work.opus)
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [keyFilter, setKeyFilter] = useState('')
    const [genreFilter, setGenreFilter] = useState('')

    // —— 调性选项 ——
    const keyOptions = useMemo(() => {
        const keys = new Set<string>()
        for (const work of allWorks) {
            const normalized = normalizeWorkKey(work.key)
            if (normalized) keys.add(normalized)
        }
        return [...keys].sort((left, right) => compareWorkKeys(left, right))
    }, [allWorks])

    const keyGroups = useMemo(() => {
        const groups: Record<string, string[]> = {}
        for (const key of keyOptions) {
            const letter = key.charAt(0).toUpperCase()
            const bucket = 'CDEFGAB'.includes(letter) ? letter : 'other'
            ;(groups[bucket] ??= []).push(key)
        }
        return ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'other']
            .map(letter => [letter, groups[letter] ?? []] as [string, string[]])
            .filter(([, keys]) => keys.length > 0)
    }, [keyOptions])

    // —— 体裁选项 ——
    const genreOptions = useMemo(() => {
        const genres = new Set<string>()
        for (const work of allWorks) {
            if (work.genre) genres.add(work.genre)
        }
        return [...genres].sort()
    }, [allWorks])

    // —— 筛选 ——
    const filteredWorks = useMemo(() => {
        let result = allWorks
        if (keyFilter) {
            result = result.filter(work => normalizeWorkKey(work.key) === keyFilter)
        }
        result = filterWorksByGenre(result, genreFilter)
        return result
    }, [allWorks, keyFilter, genreFilter])

    const filteredSortedWorks = useMemo(
        () => [...filteredWorks].sort(showDateColumn ? compareWorksByDate : compareWorksBySort),
        [filteredWorks, showDateColumn],
    )

    const normalizedQuery = normalizeSearchText(query)
    const searchMatches = useMemo(() => {
        if (!normalizedQuery) return []
        return filteredSortedWorks.filter(work => {
            const searchableText = [
                work.sort,
                work.catalogue,
                work.opus,
                work.secondaryCatalogue,
                work.title,
                work.genre,
                work.key,
                ...Object.values(work.details),
            ].join(' ')
            return normalizeSearchText(searchableText).includes(normalizedQuery)
        })
    }, [filteredSortedWorks, normalizedQuery])

    const totalSearchPages = Math.ceil(searchMatches.length / PAGE_SIZE)
    const pagedSearchMatches = searchMatches.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE,
    )
    const totalAllPages = Math.ceil(filteredSortedWorks.length / PAGE_SIZE)
    const pagedAllWorks = filteredSortedWorks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    function renderPagination(currentPage: number, totalPages: number) {
        if (totalPages <= 1) return undefined
        const pageItems = getPageItems(currentPage, totalPages)
        const goToPage = (target: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault()
            if (target < 1 || target > totalPages) return
            setPage(target)
        }
        return (
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            href="#"
                            text={t('common.previous')}
                            aria-disabled={currentPage <= 1}
                            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : undefined}
                            onClick={goToPage(currentPage - 1)}
                        />
                    </PaginationItem>
                    {pageItems.map((item, index) => (
                        <PaginationItem key={item === 'ellipsis' ? `ellipsis-${index}` : item}>
                            {item === 'ellipsis' ? (
                                <PaginationEllipsis/>
                            ) : (
                                <PaginationLink
                                    href="#"
                                    isActive={item === currentPage}
                                    onClick={goToPage(item)}
                                >
                                    {item}
                                </PaginationLink>
                            )}
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext
                            href="#"
                            text={t('common.next')}
                            aria-disabled={currentPage >= totalPages}
                            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : undefined}
                            onClick={goToPage(currentPage + 1)}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        )
    }

    return (
        <div className="flex min-w-0 flex-col gap-4">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                <div className="relative min-w-0 flex-1">
                    <IconSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                        type="search"
                        value={query}
                        placeholder={t('works.searchPlaceholder')}
                        aria-label={t('works.searchPlaceholder')}
                        className="h-10 pl-10 pr-28 [&::-webkit-search-cancel-button]:hidden"
                        onChange={event => {
                            setQuery(event.target.value)
                            setPage(1)
                        }}
                    />
                    <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
                        <span className="pointer-events-none pr-1 text-xs text-slate-500">
                            {t('works.count', {count: normalizedQuery ? searchMatches.length : filteredSortedWorks.length})}
                        </span>
                        {query && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t('common.clear')}
                                onClick={() => {
                                    setQuery('')
                                    setPage(1)
                                }}
                            >
                                <IconX/>
                            </Button>
                        )}
                    </div>
                </div>
                {genreOptions.length > 0 && (
                    <Select
                        defaultValue=""
                        onValueChange={(value: unknown) => {
                            setGenreFilter(String(value ?? ""))
                            setPage(1)
                        }}
                    >
                        <SelectTrigger
                            aria-label={t('works.genreFilterLabel')}
                            className="h-10 shrink-0 rounded-lg border border-input bg-white px-3 pr-8 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-slate-800"
                        >
                            <SelectValue placeholder={t('works.allGenres')} className="overflow-visible whitespace-nowrap text-[var(--on-surface)]"/>
                        </SelectTrigger>
                        <SelectPositioner align="start">
                            <SelectContent>
                                <SelectItem value="">{t('works.allGenres')}</SelectItem>
                                {genreOptions.map(genre => (
                                    <SelectItem key={genre} value={genre}>
                                        {getLocalizedWorkTerm(genre, 'type', locale)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </SelectPositioner>
                    </Select>
                )}
                {keyOptions.length > 0 && (
                    <Select
                        defaultValue=""
                        onValueChange={(value: unknown) => {
                            setKeyFilter(String(value ?? ""))
                            setPage(1)
                        }}
                    >
                        <SelectTrigger
                            aria-label={t('works.keyFilterLabel')}
                            className="h-10 shrink-0 rounded-lg border border-input bg-white px-3 pr-8 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-slate-800"
                        >
                            <SelectValue placeholder={t('works.allKeys')} className="text-[var(--on-surface)]"/>
                        </SelectTrigger>
                        <SelectPositioner align="start">
                            <SelectContent>
                                <SelectItem value="">{t("works.allKeys")}</SelectItem>
                                {keyGroups.map(([pitch, keys]) => (
                                    <SelectGroup key={pitch}>
                                        <SelectLabel>{pitch}</SelectLabel>
                                        {keys.map(key => (
                                            <SelectItem key={key} value={key}>
                                                {getLocalizedWorkTerm(key, "key", locale)}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </SelectPositioner>
                    </Select>
                )}
            </div>
            {normalizedQuery ? (
                <div className="flex min-w-0 flex-col gap-3">
                    {pagedSearchMatches.length > 0 ? (
                        <WorksTable
                            key={`search-${normalizedQuery}-${page}`}
                            works={pagedSearchMatches}
                            catalogCode={catalogCode}
                            showDateColumn={showDateColumn}
                            footer={renderPagination(page, totalSearchPages)}
                        />
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
                            {t('works.noSearchResults')}
                        </div>
                    )}
                </div>
            ) : pagedAllWorks.length > 0 ? (
                <WorksTable
                    key={`all-${page}-${keyFilter}-${genreFilter}`}
                    works={pagedAllWorks}
                    catalogCode={catalogCode}
                    showDateColumn={showDateColumn}
                    footer={renderPagination(page, totalAllPages)}
                />
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
                    {t('works.noWorks')}
                </div>
            )}
        </div>
    )
}
