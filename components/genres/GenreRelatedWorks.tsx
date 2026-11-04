'use client'

import {useState} from 'react'
import Link from 'next/link'
import {Button} from '@/components/ui/button'
import WorkDetailsDialog from '@/components/catalogues/WorkDetailsDialog'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import {useI18n} from '@/lib/i18n/client'
import {localePath} from '@/lib/i18n/config'
import type {ComposerWork, GenreRelatedWorkGroup} from '@/lib/db/composers'

const WORKS_PER_PAGE = 10

const rowGrid = 'grid gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1.5fr)] sm:items-center sm:px-8'

type RelatedWorkRow = {
    key: string
    work: ComposerWork
    title: string
    composerNameSort: string
    composerHref: string
    catalogue: string
}

export default function GenreRelatedWorks({groups}: {groups: GenreRelatedWorkGroup[]}) {
    const {t, locale} = useI18n()
    const [page, setPage] = useState(1)
    const [composerFilter, setComposerFilter] = useState('')

    const allRows: RelatedWorkRow[] = groups.flatMap(group => group.works.map(work => ({
        key: `${group.catalogue}-${work.workId}`,
        work,
        title: locale === 'de' ? work.details['German title'] || work.title : work.title || getLocalizedWorkTerm(work.genre, 'type', locale),
        composerNameSort: group.composerNameSort,
        composerHref: localePath(locale, `/composers/${encodeURIComponent(group.composerSlug)}`),
        catalogue: group.catalogue,
    }))).sort((left, right) => left.composerNameSort.localeCompare(right.composerNameSort, undefined, {sensitivity: 'base'}))

    if (allRows.length === 0) return null

    const composerOptions = [...new Map(groups.map(group => [group.composerNameSort, group.composerName])).entries()]
        .sort(([left], [right]) => left.localeCompare(right, undefined, {sensitivity: 'base'}))
    const rows = composerFilter ? allRows.filter(row => row.composerNameSort === composerFilter) : allRows
    const pageCount = Math.ceil(rows.length / WORKS_PER_PAGE)
    const currentPage = Math.min(page, pageCount)
    const pageRows = rows.slice((currentPage - 1) * WORKS_PER_PAGE, currentPage * WORKS_PER_PAGE)

    return (
        <section className="mt-5 overflow-hidden border border-slate-200 bg-white shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 sm:px-8">
                <h2 className="heading text-xl font-semibold text-slate-950">{t('genrePages.relatedWorks')}</h2>
                <div className="flex items-center gap-3">
                    {composerOptions.length > 1 && (
                        <select
                            aria-label={t('home.randomWiki.composer')}
                            value={composerFilter}
                            onChange={event => {
                                setComposerFilter(event.target.value)
                                setPage(1)
                            }}
                            className="max-w-56 truncate rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                        >
                            <option value="">{t('genrePages.allComposers')}</option>
                            {composerOptions.map(([sortName, name]) => <option key={sortName} value={sortName}>{name}</option>)}
                        </select>
                    )}
                    <span className="shrink-0 text-sm text-slate-500">{t('works.count', {count: rows.length})}</span>
                </div>
            </header>

            <div className={`${rowGrid} hidden border-b border-slate-200 bg-slate-50 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid`}>
                <span>{t('home.randomWiki.composer')}</span>
                <span>{t('works.titleColumn')}</span>
                <span>{t('works.key')}</span>
                <span>{t('works.instrumentation')}</span>
            </div>

            <ul>
                {pageRows.map(({key, work, title, composerNameSort, composerHref, catalogue}) => (
                    <li key={key} className={`${rowGrid} border-b border-slate-100 px-6 py-3 last:border-0 hover:bg-blue-50/50`}>
                        <Link href={composerHref} className="truncate text-sm text-slate-700 hover:text-blue-700">{composerNameSort}</Link>
                        <WorkDetailsDialog
                            work={work}
                            catalogCode={catalogue}
                            triggerClassName={`flex min-w-0 text-left text-sm ${work.details.WikiQID?.trim() ? 'text-blue-700' : ''}`}
                        >
                            <span className="truncate">{title}</span>
                        </WorkDetailsDialog>
                        <span className="truncate text-sm text-slate-700">{work.key}</span>
                        <span className="truncate text-sm text-slate-700">{work.instrumentation}</span>
                    </li>
                ))}
            </ul>

            {pageCount > 1 && (
                <nav aria-label={t('genrePages.relatedWorks')} className="flex items-center justify-between border-t border-slate-200 px-6 py-3 sm:px-8">
                    <Button type="button" variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                        {t('common.previous')}
                    </Button>
                    <span className="text-sm text-slate-500">{t('works.pageInfo', {current: currentPage, total: pageCount})}</span>
                    <Button type="button" variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
                        {t('common.next')}
                    </Button>
                </nav>
            )}
        </section>
    )
}
