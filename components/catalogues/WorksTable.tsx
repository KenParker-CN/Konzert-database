'use client'

import {useI18n} from '@/lib/i18n/client'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import type {WorkCategoryGroup} from '@/lib/data/work-groups'
import {Dialog} from '@base-ui/react/dialog'
import {Button} from '@/components/ui/button'

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
    group,
    catalogCode,
    onSelectGroup,
    otherTitle,
    countOverride,
}: {
    group: WorkCategoryGroup
    catalogCode?: string
    onSelectGroup: (group: WorkCategoryGroup) => void
    otherTitle: string
    /** Overrides the header count; used for paginated search results so the total number of matches is shown instead of the current page size. */
    countOverride?: number
}) {
    const {t, locale} = useI18n()
    const {children = [], works} = group
    const localizedTitle = getLocalizedWorkTerm(group.key === 'other' ? otherTitle : group.label, 'type', locale)
    const totalWorkCount = countOverride ?? getGroupWorkCount(group)
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
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
            <div className="max-h-[28rem] overflow-y-auto">
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
            </div>
        </section>
    )
}
