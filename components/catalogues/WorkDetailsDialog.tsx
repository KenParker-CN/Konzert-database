'use client'

import type {ReactNode} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {Dialog} from '@base-ui/react/dialog'
import {IconArrowRight, IconX} from '@tabler/icons-react'
import {useI18n} from '@/lib/i18n/client'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import {localePath} from '@/lib/i18n/config'
import {useGenreLink} from '@/components/genres/GenreLinkProvider'
import {formatWorkDetailValue, getWorkDetailFields, getWorkDetailLabelKey, isFullWidthWorkDetail} from '@/lib/works/work-detail-fields'
import InstrumentationLegendDialog from './InstrumentationLegendDialog'
import GenreIntroduction from '../genres/GenreIntroduction'
import GenreHovercard from '../genres/GenreHovercard'

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
    const genreLink = useGenreLink(work.genre || '')
    const getWorkTitle = (entry: WorkDetailsEntry) => locale === 'de'
        ? entry.details['German title'] || entry.title
        : entry.title
    const detailFields = getWorkDetailFields(work.details, catalogCode, locale)

    const detailFieldLabel = (field: string) => {
        const key = getWorkDetailLabelKey(field)
        return key ? t(key) : field
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
                        <Dialog.Title className="flex items-baseline gap-2">
                            <span className="heading text-xl font-semibold text-slate-950">
                                {getWorkTitle(work) || getLocalizedWorkTerm(work.genre, 'type', locale) || work.catalogue || work.opus}
                            </span>
                            {work.details['Subtitle'] && (
                                <span className="text-base italic text-slate-500">
                                    {work.details['Subtitle']}
                                </span>
                            )}
                            {catalogCode === 'KV' && work.details['ID'] && (
                                <Link
                                    href={`https://kv.mozarteum.at/work/${work.details['ID']}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={t('works.openKvPage')}
                                    title={t('works.openKvPage')}
                                    className="inline-flex shrink-0 self-center rounded opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    <Image src="/kv-favicon.png" alt="" width={18} height={18}/>
                                </Link>
                            )}
                        </Dialog.Title>
                        <Dialog.Description className="mt-1 text-sm text-slate-500">
                            {[work.catalogue, work.secondaryCatalogue].filter(Boolean).join(' · ') || work.opus || work.date}
                        </Dialog.Description>
                        {(work.genre || work.key) && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                {work.genre && (() => {
                                    const badge = (
                                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                            {getLocalizedWorkTerm(work.genre, 'type', locale)}
                                        </span>
                                    )
                                    if (!genreLink) return badge
                                    return (
                                        <GenreHovercard genreTerm={work.genre} genreWikiID={genreLink.wikiID} locale={locale}>
                                            <Link
                                                href={localePath(locale, genreLink.path)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex rounded-full transition-colors hover:bg-emerald-100"
                                            >
                                                {badge}
                                            </Link>
                                        </GenreHovercard>
                                    )
                                })()}
                                {work.key && (
                                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                        {getLocalizedWorkTerm(work.key, 'key', locale)}
                                    </span>
                                )}
                            </div>
                        )}
                        <Dialog.Close className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label={t('common.close')}>
                            <IconX size={18}/>
                        </Dialog.Close>
                    </div>
                    {work.details['WikiQID'] && (
                        <div className="shrink-0 border-b border-slate-100 px-5 py-3">
                            <GenreIntroduction wikiID={work.details['WikiQID']} locale={locale} variant="dialog"/>
                        </div>
                    )}
                    <dl className="grid min-h-0 flex-1 grid-cols-1 gap-x-6 gap-y-4 overflow-y-auto p-5 sm:grid-cols-2">
                        {detailFields.map(([field, value]) => {
                            const normalizedField = field.toLocaleLowerCase()

                            return (
                                <div key={field} className={`min-w-0 ${isFullWidthWorkDetail(field) ? 'sm:col-span-2' : ''}`}>
                                    <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                                        {detailFieldLabel(field)}
                                        {['instrumentation', 'instrmentation'].includes(normalizedField) && (
                                            <InstrumentationLegendDialog triggerClassName="inline-flex shrink-0 items-center justify-center text-blue-400 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded" />
                                        )}
                                    </dt>
                                    <dd className="mt-1 min-w-0 text-sm text-slate-900">
                                        <span className="whitespace-pre-wrap wrap-break-word">
                                            {formatWorkDetailValue(field, value, locale)}
                                        </span>
                                    </dd>
                                </div>
                            )
                        })}
                    </dl>
                    {work.details['WikiQID'] && (
                        <div className="flex shrink-0 justify-end border-t border-slate-100 px-5 py-3">
                            <Link
                                href={localePath(locale, `/works/${work.details['WikiQID']}`)}
                                aria-label={t('works.openPage')}
                                title={t('works.openPage')}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                                <IconArrowRight size={18}/>
                            </Link>
                        </div>
                    )}
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
