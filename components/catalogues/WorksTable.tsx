'use client'

import {useI18n} from '@/lib/i18n/client'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import {compareWorksBySort, type WorkCategoryGroup} from '@/lib/data/work-groups'
import {Button} from '@/components/ui/button'
import type {ReactNode} from 'react'
import useAutoHideScrollbar from '@/components/hooks/useAutoHideScrollbar'
import WorkDetailsDialog from '@/components/catalogues/WorkDetailsDialog'
function getGroupWorkCount(group: WorkCategoryGroup): number {
    return group.works.length + (group.children ?? []).reduce(
        (count, child) => count + getGroupWorkCount(child),
        0,
    )
}

export default function WorksTable({
    group,
    catalogCode,
    onSelectGroup,
    otherTitle,
    countOverride,
    footer,
}: {
    group: WorkCategoryGroup
    catalogCode?: string
    onSelectGroup: (group: WorkCategoryGroup) => void
    otherTitle: string
    /** Overrides the header count so paginated views show the full result count instead of the current page size. */
    countOverride?: number
    footer?: ReactNode
}) {
    const {t, locale} = useI18n()
    const listScrollbar = useAutoHideScrollbar()
    const {children = [], works} = group
    const sortedWorks = [...works].sort(compareWorksBySort)
    const localizedTitle = getLocalizedWorkTerm(group.key === 'other' ? otherTitle : group.label, 'type', locale)
    const totalWorkCount = countOverride ?? getGroupWorkCount(group)

    return (
        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:h-[max(18rem,min(40rem,calc(100dvh-19rem)))]">
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
                <h2 className="heading min-w-0 text-base font-semibold text-slate-950">{localizedTitle}</h2>
                <span className="shrink-0 text-sm text-slate-500">{t('works.count', {count: totalWorkCount})}</span>
            </header>
            {children.length > 0 && (
                <ul aria-label={t('works.subgroups')} className="grid grid-cols-1 gap-2 border-b border-slate-200 p-3 sm:grid-cols-2">
                    {children.map(child => (
                        <li key={child.key}>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-auto min-h-10 w-full justify-between gap-2 whitespace-normal py-2 text-left"
                                onClick={() => onSelectGroup(child)}
                            >
                                <span className="min-w-0">{child.label}</span>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {t('works.count', {count: getGroupWorkCount(child)})}
                                </span>
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
            <div className={`${listScrollbar.className} max-h-112 overflow-y-auto md:min-h-0 md:max-h-none md:flex-1`} onScroll={listScrollbar.onScroll}>
                {sortedWorks.map(work => (
                    <WorkDetailsDialog
                        key={work.workId}
                        work={work}
                        catalogCode={catalogCode}
                        triggerClassName="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-blue-50/50"
                    >
                        <span className="w-24 shrink-0 font-semibold text-blue-700">{work.catalogue || work.opus || work.date}</span>
                        {work.genre && (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                {getLocalizedWorkTerm(work.genre, 'type', locale)}
                            </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-900">{locale === 'de' ? work.details['German title'] || work.title : work.title}</span>
                        {work.key && (
                            <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                {getLocalizedWorkTerm(work.key, 'key', locale)}
                            </span>
                        )}
                    </WorkDetailsDialog>
                ))}
            </div>
            {footer && <div className="shrink-0 border-t border-slate-200 px-4 py-3">{footer}</div>}
        </section>
    )
}
