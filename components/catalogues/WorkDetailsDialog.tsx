'use client'

import type {ReactNode} from 'react'
import {Dialog} from '@base-ui/react/dialog'
import {IconX} from '@tabler/icons-react'
import {useI18n} from '@/lib/i18n/client'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import InstrumentationLegendDialog from './InstrumentationLegendDialog'

export type WorkDetailsEntry = {
    workId: number
    catalogue: string
    opus: string
    secondaryCatalogue: string
    date: string
    title: string
    genre: string
    key: string
    details: Record<string, string>
}

export default function WorkDetailsDialog({
    work,
    catalogCode,
    triggerClassName,
    children,
}: {
    work: WorkDetailsEntry
    catalogCode?: string
    triggerClassName: string
    children: ReactNode
}) {
    const {t, locale} = useI18n()
    const getWorkTitle = (entry: WorkDetailsEntry) => locale === 'de'
        ? entry.details['German title'] || entry.title
        : entry.title
    const detailFields = Object.entries(work.details).filter(([field]) => {
        const normalizedField = field.toLocaleLowerCase()
        if (locale === 'de' && normalizedField === 'german title') return false
        if (normalizedField === 'catalogue') return false
        // Key is shown as a colored badge next to the title in the header.
        if (normalizedField === 'key') return false
        // Title is already shown as the dialog title above.
        if (normalizedField === 'title') return false
        // Genre is shown as a colored badge next to the title in the header.
        if (normalizedField === 'genre' || normalizedField === 'type') return false
        if (catalogCode === 'Helm' && ['wotquenne', 'wq', 'helm', 'h'].includes(normalizedField)) return false
        // Kirkpatrick's numbering columns (Kk., Longo, Pestelli) are already shown
        // in the dialog header as catalogue and secondary catalogue numbers.
        if (catalogCode === 'Kirkpatrick' && ['kirkpatrick', 'longo', 'pestelli', 'sort_kk'].includes(normalizedField)) return false
        // The CNW sheet carries the older FS numbering next to the CNW numbers.
        return !(catalogCode === 'CNW' && normalizedField === 'fs');

    })

    const detailFieldLabel = (field: string) => {
        switch (field.toLocaleLowerCase()) {
            case 'catalogue': return t('works.catalogue')
            case 'opus': return t('works.opus')
            case 'title': return t('works.titleColumn')
            case 'date': return t('works.date')
            case 'genre':return t('works.genre')
            case 'key': return t('works.key')
            case 'instrumentation': return t('works.instrumentation')
            case 'work structure':return t('works.workStructure')
            case 'note': return t('works.note')
            case 'german title': return t('works.germanTitle')
            case 'nickname': return t('works.nickname')
            case 'other catalogue references': return t('works.otherCatalogueReferences')
            case 'vocal title': return t('works.vocalTitle')
            case 'tempo': return t('works.tempo')
            case 'meter': return t('works.meter')
            case 'measures': return t('works.measures')
            case 'genres': return t('works.genres')
            case 'creation location': return t('works.creationLocation')
            default: return field
        }
    }

    return (
        <Dialog.Root>
            <Dialog.Trigger
                className={triggerClassName}
                aria-label={`${t('works.viewDetails')}: ${getWorkTitle(work) || getLocalizedWorkTerm(work.genre, 'type', locale) || work.catalogue || work.opus}`}
            >
                {children}
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity data-ending-style:opacity-0"/>
                <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(85vh,48rem)] w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-slate-200 bg-white shadow-xl outline-none">
                    <div className="relative border-b border-slate-200 p-5 pr-12">
                        <div className="flex flex-wrap items-center gap-2">
                            <Dialog.Title className="heading text-xl font-semibold text-slate-950">
                                {getWorkTitle(work) || getLocalizedWorkTerm(work.genre, 'type', locale) || work.catalogue || work.opus}
                            </Dialog.Title>
                            {work.genre && (
                                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                    {getLocalizedWorkTerm(work.genre, 'type', locale)}
                                </span>
                            )}
                            {work.key && (
                                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                    {getLocalizedWorkTerm(work.key, 'key', locale)}
                                </span>
                            )}
                        </div>
                        <Dialog.Description className="mt-1 text-sm text-slate-500">
                            {[work.catalogue, work.secondaryCatalogue].filter(Boolean).join(' · ') || work.opus || work.date}
                        </Dialog.Description>
                        <Dialog.Close className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label={t('common.close')}>
                            <IconX size={18}/>
                        </Dialog.Close>
                    </div>
                    <dl className="grid min-h-0 grid-cols-1 gap-x-6 gap-y-4 overflow-y-auto p-5 sm:grid-cols-2">
                        {detailFields.map(([field, value]) => {
                            const normalizedField = field.toLocaleLowerCase()
                            const fullWidthFields = ['workparts', 'work structure', 'movement', 'movements', 'section', 'instrumentation', 'instrmentation', 'note', 'rec_recmd']

                            return (
                                <div key={field} className={`min-w-0 ${fullWidthFields.includes(normalizedField) ? 'sm:col-span-2' : ''}`}>
                                    <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                                        {detailFieldLabel(field)}
                                        {['instrumentation', 'instrmentation'].includes(normalizedField) && (
                                            <InstrumentationLegendDialog triggerClassName="inline-flex shrink-0 items-center justify-center text-blue-400 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded" />
                                        )}
                                    </dt>
                                    <dd className="mt-1 min-w-0 text-sm text-slate-900">
                                        <span className="whitespace-pre-wrap wrap-break-word">
                                            {normalizedField === 'genre' || normalizedField === 'type'
                                                ? getLocalizedWorkTerm(value, 'type', locale)
                                                : normalizedField === 'key'
                                                    ? getLocalizedWorkTerm(value, 'key', locale)
                                                    : ['instrumentation', 'instrmentation'].includes(normalizedField)
                                                        ? getLocalizedWorkTerm(value, 'instrumentation', locale)
                                                        : value}
                                        </span>
                                    </dd>
                                </div>
                            )
                        })}
                    </dl>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
