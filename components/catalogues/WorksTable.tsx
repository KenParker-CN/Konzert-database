'use client'

import {useI18n} from '@/lib/i18n/client'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import type {WorkCategoryGroup} from '@/lib/data/work-groups'
import {Dialog} from '@base-ui/react/dialog'
import {ChevronRight} from 'lucide-react'
import {useRef} from 'react'

type WorkEntry = {
    workId: number
    catalogue: string
    opus: string
    secondaryCatalogue: string
    date: string
    title: string
    type: string
    key: string
    details: Record<string, string>
}

function getSpotifyEmbedUrl(value: string) {
    try {
        const url = new URL(value)
        if (url.protocol !== 'https:' || !['open.spotify.com', 'play.spotify.com'].includes(url.hostname)) return null

        const path = url.pathname.split('/').filter(Boolean)
        if (path[0]?.startsWith('intl-')) path.shift()
        const [type, id] = path
        if (!['track', 'album', 'playlist', 'episode', 'show'].includes(type) || !id || !/^[a-zA-Z0-9]+$/.test(id)) return null

        return `https://open.spotify.com/embed/${type}/${id}`
    } catch {
        return null
    }
}

function getGroupWorkCount(group: WorkCategoryGroup): number {
    return group.works.length + (group.children ?? []).reduce(
        (count, child) => count + getGroupWorkCount(child),
        0,
    )
}

export default function WorksTable({
    title,
    works,
    catalogCode,
    children = [],
    path,
    openPath,
    onToggle,
    depth = 0,
}: {
    title: string
    works: WorkEntry[]
    catalogCode?: string
    children?: WorkCategoryGroup[]
    path: string[]
    openPath: string[]
    onToggle: (path: string[]) => void
    depth?: number
}) {
    const {t, locale} = useI18n()
    const summaryRef = useRef<HTMLElement>(null)
    const localizedTitle = getLocalizedWorkTerm(title, 'type', locale)
    const totalWorkCount = works.length + children.reduce((count, child) => count + getGroupWorkCount(child), 0)
    const isOpen = path.every((key, index) => openPath[index] === key)
    const getWorkTitle = (work: WorkEntry) => locale === 'de'
        ? work.details['German title'] || work.title
        : work.title

    const detailFields = (work: WorkEntry) => Object.entries(work.details).filter(([field]) => {
        const normalizedField = field.toLocaleLowerCase()
        if (locale === 'de' && normalizedField === 'german title') return false
        if (normalizedField === 'catalogue' && catalogCode !== 'LWV') return false
        if (catalogCode === 'MWV' && normalizedField === 'mwv') return false
        return !(catalogCode === 'CPE' && ['wotquenne', 'wq', 'helm', 'h'].includes(normalizedField))
    })

    const detailFieldLabel = (field: string) => {
        switch (field.toLocaleLowerCase()) {
            case 'catalogue': return t('works.catalogue')
            case 'opus': return t('works.opus')
            case 'wotquenne':
            case 'wq': return t('works.wotquenne')
            case 'helm':
            case 'h': return t('works.helm')
            case 'title': return t('works.titleColumn')
            case 'date': return t('works.date')
            case 'type': return t('works.type')
            case 'key': return t('works.key')
            case 'instrumentation':
            case 'instrmentation': return t('works.instrumentation')
            case 'workparts': return t('works.workparts')
            case 'note': return t('works.note')
            case 'rec_recmd': return t('works.recommendedRecording')
            case 'german title': return t('works.germanTitle')
            case 'nickname': return t('works.nickname')
            case 'other catalogue references': return t('works.otherCatalogueReferences')
            case 'movement': return t('works.movement')
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
        <details
            open={isOpen}
            style={{marginInlineStart: depth ? `${depth * 1.25}rem` : undefined}}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
            <summary
                ref={summaryRef}
                onClick={event => {
                    event.preventDefault()
                    if (!isOpen) {
                        requestAnimationFrame(() => {
                            summaryRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'})
                        })
                    }
                    onToggle(path)
                }}
                className="flex scroll-mt-4 cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden"
            >
                <span className="flex min-w-0 items-center gap-2">
                    <ChevronRight size={18} className="shrink-0 text-slate-400 transition-transform group-open:rotate-90"/>
                    <span className="heading select-none truncate text-base font-semibold text-slate-950">{localizedTitle}</span>
                </span>
                <span className="shrink-0 text-sm text-slate-500">{t('works.count', {count: totalWorkCount})}</span>
            </summary>
            <div className="max-h-[28rem] overflow-y-auto border-t border-slate-200">
                {works.map(work => (
                    <Dialog.Root key={work.workId}>
                        <Dialog.Trigger
                            className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-blue-50/50"
                            aria-label={`${t('works.viewDetails')}: ${getWorkTitle(work) || getLocalizedWorkTerm(work.type, 'type', locale) || work.catalogue || work.opus}`}
                        >
                            <span className="w-24 shrink-0 font-semibold text-blue-700">{work.catalogue || work.opus}</span>
                            <span className="min-w-0 flex-1 truncate text-sm text-slate-900">{getWorkTitle(work) || getLocalizedWorkTerm(work.type, 'type', locale) || work.catalogue || work.opus}</span>
                        </Dialog.Trigger>
                        <Dialog.Portal>
                            <Dialog.Backdrop className="fixed inset-0 bg-black/40 transition-opacity data-ending-style:opacity-0"/>
                            <Dialog.Popup className="fixed left-1/2 top-1/2 flex max-h-[min(85vh,48rem)] w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl outline-none">
                                <div className="border-b border-slate-200 p-5">
                                    <Dialog.Title className="heading text-xl font-semibold text-slate-950">
                                        {getWorkTitle(work) || getLocalizedWorkTerm(work.type, 'type', locale) || work.catalogue || t('works.details')}
                                    </Dialog.Title>
                                    <Dialog.Description className="mt-1 text-sm text-slate-500">
                                        {[work.catalogue, work.secondaryCatalogue].filter(Boolean).join(' · ')}
                                    </Dialog.Description>
                                </div>
                                <dl className="grid min-h-0 grid-cols-1 gap-x-6 gap-y-4 overflow-y-auto p-5 sm:grid-cols-2">
                                    {detailFields(work).map(([field, value]) => {
                                        const isRecommendedRecording = field.toLocaleLowerCase() === 'rec_recmd'
                                        const isSpotifyRecommendation = catalogCode === 'BuxWV' && isRecommendedRecording
                                        const spotifyEmbedUrl = isSpotifyRecommendation ? getSpotifyEmbedUrl(value) : null
                                        const fullWidthFields = ['workparts', 'movement', 'movements', 'instrumentation', 'note', 'rec_recmd']

                                        return (
                                            <div
                                                key={field}
                                                className={`min-w-0 ${fullWidthFields.includes(field.toLocaleLowerCase()) ? 'sm:col-span-2' : ''}`}
                                            >
                                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    {detailFieldLabel(field)}
                                                </dt>
                                                <dd className="mt-1 min-w-0 text-sm text-slate-900">
                                                    {spotifyEmbedUrl ? (
                                                        <iframe
                                                            title={`${getWorkTitle(work) || work.catalogue} on Spotify`}
                                                            src={spotifyEmbedUrl}
                                                            width="100%"
                                                            height={spotifyEmbedUrl.includes('/track/') || spotifyEmbedUrl.includes('/episode/') ? 152 : 352}
                                                            loading="lazy"
                                                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                            referrerPolicy="strict-origin-when-cross-origin"
                                                            className="max-w-full rounded-lg border-0"
                                                        />
                                                    ) : (
                                                        <span className="whitespace-pre-wrap wrap-break-word">
                                                            {field.toLocaleLowerCase() === 'type'
                                                                ? getLocalizedWorkTerm(value, 'type', locale)
                                                                : field.toLocaleLowerCase() === 'key'
                                                                    ? getLocalizedWorkTerm(value, 'key', locale)
                                                                : ['instrumentation', 'instrmentation', 'setting'].includes(field.toLocaleLowerCase())
                                                                    ? getLocalizedWorkTerm(value, 'instrumentation', locale)
                                                                    : value}
                                                        </span>
                                                    )}
                                                </dd>
                                            </div>
                                        )
                                    })}
                                </dl>
                                <div className="flex justify-end border-t border-slate-200 p-4">
                                    <Dialog.Close className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                        {t('common.close')}
                                    </Dialog.Close>
                                </div>
                            </Dialog.Popup>
                        </Dialog.Portal>
                    </Dialog.Root>
                ))}
                {children.map(child => (
                    <WorksTable
                        key={child.key}
                        title={child.label}
                        works={child.works}
                        catalogCode={catalogCode}
                        children={child.children}
                        path={[...path, child.key]}
                        openPath={openPath}
                        onToggle={onToggle}
                        depth={depth + 1}
                    />
                ))}
            </div>
        </details>
    )
}
