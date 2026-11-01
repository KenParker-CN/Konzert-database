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

const rowGrid = 'grid grid-cols-[minmax(0,1fr)] items-center gap-x-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] sm:px-8'

type RelatedWorkRow = {
    work: ComposerWork
    composerName: string
    composerHref: string
    catalogueName: string
    catalogueHref: string
}

export default function GenreRelatedWorks({groups}: {groups: GenreRelatedWorkGroup[]}) {
    const {t, locale} = useI18n()
    const [page, setPage] = useState(1)

    const rows: RelatedWorkRow[] = groups.flatMap(group => {
        const catalogueHref = localePath(locale, `/catalogues/${encodeURIComponent(group.catalogue)}`)
        return group.works.map(work => ({
            work,
            composerName: group.composerName,
            composerHref: catalogueHref,
            catalogueName: group.catalogueName,
            catalogueHref,
        }))
    })

    if (rows.length === 0) return null

    const pageCount = Math.ceil(rows.length / WORKS_PER_PAGE)
    const currentPage = Math.min(page, pageCount)
    const pageRows = rows.slice((currentPage - 1) * WORKS_PER_PAGE, currentPage * WORKS_PER_PAGE)

    return (
        <section className="mt-5 overflow-hidden border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 sm:px-8">
                <h2 className="heading text-xl font-semibold text-slate-950">{t('genrePages.relatedWorks')}</h2>
                <span className="shrink-0 text-sm text-slate-500">{t('works.count', {count: rows.length})}</span>
            </header>

            <div className={`${rowGrid} hidden border-b border-slate-200 bg-slate-50 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid`}>
                <span>{t('works.titleColumn')}</span>
                <span>{t('home.randomWiki.composer')}</span>
                <span>{t('works.catalogue')}</span>
            </div>

            <ul>
                {pageRows.map(({work, composerName, composerHref, catalogueName, catalogueHref}) => (
                    <li key={`${work.catalogue}-${work.workId}-${composerHref}`} className={`${rowGrid} border-b border-slate-100 px-6 py-3 last:border-0 hover:bg-blue-50/50`}>
                        <WorkDetailsDialog
                            work={work}
                            catalogCode={work.catalogue}
                            triggerClassName="flex min-w-0 items-center gap-3 text-left"
                        >
                            <span className="w-24 shrink-0 font-semibold text-blue-700">{work.catalogue || work.opus}</span>
                            <span className="min-w-0 flex-1 truncate text-sm text-slate-900">
                                {locale === 'de' ? work.details['German title'] || work.title : work.title || getLocalizedWorkTerm(work.genre, 'type', locale)}
                            </span>
                        </WorkDetailsDialog>
                        <div className="mt-1 flex min-w-0 flex-wrap gap-x-2 text-xs text-slate-500 sm:hidden">
                            <Link href={composerHref} className="truncate hover:text-blue-700">{composerName}</Link>
                            <span aria-hidden="true">·</span>
                            <Link href={catalogueHref} className="truncate hover:text-blue-700">{catalogueName}</Link>
                        </div>
                        <Link href={composerHref} className="hidden truncate text-sm text-slate-700 hover:text-blue-700 sm:block">{composerName}</Link>
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
