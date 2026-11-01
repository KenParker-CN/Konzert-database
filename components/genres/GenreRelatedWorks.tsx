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

const rowGrid = 'grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-4 sm:grid-cols-[6rem_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)] sm:px-8'

type RelatedWorkRow = {
    key: string
    work: ComposerWork
    title: string
    composerName: string
    catalogueName: string
    catalogueHref: string
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
        composerName: group.composerName,
        catalogueName: group.catalogueName,
        catalogueHref: localePath(locale, `/catalogues/${encodeURIComponent(group.catalogue)}`),
        catalogue: group.catalogue,
    })))

    if (allRows.length === 0) return null

    const composerOptions = groups.map(group => group.composerName)
    const rows = composerFilter ? allRows.filter(row => row.composerName === composerFilter) : allRows
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
                            {composerOptions.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    )}
                    <span className="shrink-0 text-sm text-slate-500">{t('works.count', {count: rows.length})}</span>
                </div>
            </header>

            <div className={`${rowGrid} hidden border-b border-slate-200 bg-slate-50 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid`}>
                <span>{t('works.catalogue')}</span>
                <span>{t('works.titleColumn')}</span>
                <span>{t('home.randomWiki.composer')}</span>
                <span>{t('search.catalogues')}</span>
            </div>

            <ul>
                {pageRows.map(({key, work, title, composerName, catalogueName, catalogueHref, catalogue}) => (
                    <li key={key} className={`${rowGrid} border-b border-slate-100 px-6 py-3 last:border-0 hover:bg-blue-50/50`}>
                        <WorkDetailsDialog
                            work={work}
                            catalogCode={catalogue}
                            triggerClassName="flex min-w-0 text-left font-semibold text-blue-700"
                        >
                            <span className="truncate">{work.catalogue || work.opus}</span>
                        </WorkDetailsDialog>
                        <WorkDetailsDialog
                            work={work}
                            catalogCode={catalogue}
                            triggerClassName="flex min-w-0 text-left text-sm text-slate-900"
                        >
                            <span className="truncate">{title}</span>
                        </WorkDetailsDialog>
                        <div className="col-span-2 mt-1 flex min-w-0 flex-wrap gap-x-2 text-xs text-slate-500 sm:hidden">
                            <span>{composerName}</span>
                            <span aria-hidden="true">·</span>
                            <Link href={catalogueHref} className="truncate hover:text-blue-700">{catalogueName}</Link>
                        </div>
                        <span className="hidden truncate text-sm text-slate-700 sm:block">{composerName}</span>
                        <Link href={catalogueHref} className="hidden truncate text-sm text-slate-700 hover:text-blue-700 sm:block">{catalogueName}</Link>
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
