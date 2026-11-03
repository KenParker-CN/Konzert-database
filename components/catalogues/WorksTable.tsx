'use client'

import {useI18n} from '@/lib/i18n/client'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import type {ComposerWork} from '@/lib/db/composers'
import type {ReactNode} from 'react'
import useAutoHideScrollbar from '@/components/hooks/useAutoHideScrollbar'
import WorkDetailsDialog from '@/components/catalogues/WorkDetailsDialog'

export default function WorksTable({
    title,
    works,
    catalogCode,
    totalCount,
    footer,
}: {
    title: string
    works: ComposerWork[]
    catalogCode?: string
    totalCount: number
    footer?: ReactNode
}) {
    const {t, locale} = useI18n()
    const listScrollbar = useAutoHideScrollbar()
    const localizedTitle = getLocalizedWorkTerm(title, 'type', locale)

    return (
        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:h-[max(18rem,500px)]">
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
                <h2 className="heading min-w-0 text-base font-semibold text-slate-950">{localizedTitle}</h2>
                <span className="shrink-0 text-sm text-slate-500">{t('works.count', {count: totalCount})}</span>
            </header>
            <div className="flex shrink-0 items-center divide-x divide-slate-200 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="w-24 shrink-0 px-1.5 text-center">{t('works.catalogue')}</span>
                <span className="w-72 shrink-0 px-1.5 text-center">{t('works.titleColumn')}</span>
                <span className="w-28 shrink-0 px-1.5 text-center">{t('works.genre')}</span>
                <span className="w-28 shrink-0 px-1.5 text-center">{t('works.key')}</span>
                <span className="w-40 shrink-0 px-1.5 text-center">{t('works.instrumentation')}</span>
            </div>
            <div className={`${listScrollbar.className} max-h-112 overflow-y-auto md:min-h-0 md:max-h-none md:flex-1`} onScroll={listScrollbar.onScroll}>
                {works.map(work => (
                    <WorkDetailsDialog
                        key={work.workId}
                        work={work}
                        catalogCode={catalogCode}
                        triggerClassName="flex w-full items-center divide-x divide-slate-200 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-blue-50/50"
                    >
                        <span className="w-24 shrink-0 px-1.5 text-center font-semibold text-blue-700">{work.catalogue || work.opus || work.date}</span>
                        <span className="w-72 shrink-0 truncate px-1.5 text-sm text-slate-900">{locale === 'de' ? work.details['German title'] || work.title : work.title}</span>
                        <span className="flex w-28 shrink-0 justify-center px-1.5">
                            {work.genre && (
                                <span className="max-w-full truncate rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                    {getLocalizedWorkTerm(work.genre, 'type', locale)}
                                </span>
                            )}
                        </span>
                        <span className="flex w-28 shrink-0 justify-center px-1.5">
                            {work.key && (
                                <span className="max-w-full truncate rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                    {getLocalizedWorkTerm(work.key, 'key', locale)}
                                </span>
                            )}
                        </span>
                        <span className="w-40 shrink-0 truncate px-1.5 text-left text-xs text-slate-500">{work.instrumentation}</span>
                    </WorkDetailsDialog>
                ))}
            </div>
            {footer && <div className="shrink-0 border-t border-slate-200 px-4 py-3">{footer}</div>}
        </section>
    )
}
