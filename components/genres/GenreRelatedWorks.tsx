'use client'

import {useState} from 'react'
import {Button} from '@/components/ui/button'
import WorkDetailsDialog from '@/components/catalogues/WorkDetailsDialog'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import {useI18n} from '@/lib/i18n/client'
import type {GenreRelatedWorkGroup} from '@/lib/db/composers'
import {IconChevronDown} from '@tabler/icons-react'

const WORKS_PER_PAGE = 10

export default function GenreRelatedWorks({groups}: {groups: GenreRelatedWorkGroup[]}) {
    const {t, locale} = useI18n()
    const [pages, setPages] = useState<Record<string, number>>({})
    const workCount = groups.reduce((count, group) => count + group.works.length, 0)

    if (groups.length === 0) return null

    return (
        <section className="mt-5 overflow-hidden border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 sm:px-8">
                <h2 className="heading text-xl font-semibold text-slate-950">{t('genrePages.relatedWorks')}</h2>
                <span className="shrink-0 text-sm text-slate-500">{t('works.count', {count: workCount})}</span>
            </header>

            <div className="divide-y divide-slate-200">
                {groups.map(group => {
                    const pageCount = Math.ceil(group.works.length / WORKS_PER_PAGE)
                    const page = Math.min(pages[group.catalogue] ?? 1, pageCount)
                    const pageWorks = group.works.slice((page - 1) * WORKS_PER_PAGE, page * WORKS_PER_PAGE)

                    return (
                        <details key={group.catalogue} className="group">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-slate-50 px-6 py-3 marker:hidden hover:bg-slate-100 sm:px-8">
                                <div className="min-w-0">
                                    <h3 className="truncate text-sm font-semibold text-slate-800">{group.composerName}</h3>
                                    <p className="mt-0.5 truncate text-xs text-slate-500">{group.catalogueName}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <span className="text-xs text-slate-500">{t('works.count', {count: group.works.length})}</span>
                                    <IconChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true"/>
                                </div>
                            </summary>

                            <ul>
                                {pageWorks.map(work => (
                                    <li key={`${group.catalogue}-${work.workId}`}>
                                        <WorkDetailsDialog
                                            work={work}
                                            catalogCode={group.catalogue}
                                            triggerClassName="flex w-full items-center gap-3 border-b border-slate-100 px-6 py-3 text-left transition-colors last:border-0 hover:bg-blue-50/50 sm:px-8"
                                        >
                                            <span className="w-24 shrink-0 font-semibold text-blue-700">{work.catalogue || work.opus}</span>
                                            <span className="min-w-0 flex-1 truncate text-sm text-slate-900">
                                                {locale === 'de' ? work.details['German title'] || work.title : work.title || getLocalizedWorkTerm(work.genre, 'type', locale) || work.catalogue || work.opus}
                                            </span>
                                        </WorkDetailsDialog>
                                    </li>
                                ))}
                            </ul>

                            {pageCount > 1 && (
                                <nav aria-label={`${group.composerName} ${t('genrePages.relatedWorks')}`} className="flex items-center justify-between border-t border-slate-200 px-6 py-3 sm:px-8">
                                    <Button type="button" variant="outline" size="sm" disabled={page === 1} onClick={() => setPages(current => ({...current, [group.catalogue]: page - 1}))}>
                                        {t('common.previous')}
                                    </Button>
                                    <span className="text-sm text-slate-500">{t('works.pageInfo', {current: page, total: pageCount})}</span>
                                    <Button type="button" variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPages(current => ({...current, [group.catalogue]: page + 1}))}>
                                        {t('common.next')}
                                    </Button>
                                </nav>
                            )}
                        </details>
                    )
                })}
            </div>
        </section>
    )
}
