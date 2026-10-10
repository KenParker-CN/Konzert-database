'use client'

import {useState} from 'react'
import {useI18n} from '@/lib/i18n/client'
import {Info, Search, X} from 'lucide-react'
import {Dialog} from '@base-ui/react/dialog'
import {
    Select,
    SelectGroup,
    SelectItem,
    SelectPopup,
    SelectPortal,
    SelectPositioner,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
} from '@/components/ui/pagination'

const PAGE_SIZE = 10
const ALL_TYPES_VALUE = ''
const ALL_KEYS_VALUE = ''
const catalogueHeaders: Record<string, string> = {
    BWV: 'BWV',
    BuxWV: 'BuxWV',
    CPE: 'Wotquenn',
    Corelli: 'Opus',
    Deutsch: 'D',
    Hob: 'Hoboken',
    HWV: 'HWV',
    KV: 'KV',
    LWV: 'LWV',
    Marnat: 'Marnat',
    MWV: 'MWV',
    RCT: 'RCT',
    RV: 'RV',
    TWV: 'TWV',
}

type PaginatedWork = {
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

export default function WorksTable({works, catalogCode}: { works: PaginatedWork[]; catalogCode?: string }) {
    const {t} = useI18n()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [keyFilter, setKeyFilter] = useState('')
    const hasTypeColumn = catalogCode !== 'Marnat'
    const hasKeyColumn = catalogCode !== 'LWV'
    const hasTitleColumn = catalogCode !== 'Corelli'
    const hasDateColumn = catalogCode !== 'Corelli'
    const hasCatalogueColumn = catalogCode !== 'shosta'
    const types = [...new Set(works.map(work => work.type).filter(Boolean))].sort((a, b) => a.localeCompare(b))
    const keys = [...new Set(works.map(work => work.key).filter(Boolean))].sort((a, b) => a.localeCompare(b))
    const normalizedSearch = search.trim().toLocaleLowerCase()
    const filteredWorks = works.filter(work => {
        const matchesSearch = !normalizedSearch || [
            work.catalogue,
            work.opus,
            work.secondaryCatalogue,
            hasDateColumn ? work.date : null,
            hasTitleColumn ? work.title : null,
            work.type,
            work.key,
            ...Object.values(work.details),
        ].filter(Boolean).some(value => value.toLocaleLowerCase().includes(normalizedSearch))
        const matchesType = !typeFilter || work.type === typeFilter
        const matchesKey = !keyFilter || (hasKeyColumn && work.key === keyFilter)
        return matchesSearch && matchesType && matchesKey
    })
    const totalPages = Math.max(1, Math.ceil(filteredWorks.length / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)
    const rows = filteredWorks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    const blankRows = PAGE_SIZE - rows.length
    const hasFilters = Boolean(search || typeFilter || keyFilter)
    const hasOpusColumn = !['TWV', 'BWV', 'Marnat', 'LWV', 'Corelli', 'RCT'].includes(catalogCode ?? '')
    const catalogueHeader = (catalogCode && catalogueHeaders[catalogCode]) || t('works.catalogue')
    const columnCount = Number(hasCatalogueColumn)
        + Number(catalogCode === 'CPE')
        + Number(hasOpusColumn)
        + Number(hasDateColumn)
        + Number(hasTitleColumn)
        + Number(hasTypeColumn)
        + Number(hasKeyColumn)
        + 1
    const detailFields = (work: PaginatedWork) => Object.entries(work.details).filter(([field]) => {
        const normalizedField = field.toLocaleLowerCase()
        if (normalizedField === 'catalogue') return false
        if (catalogCode === 'MWV' && normalizedField === 'mwv') return false
        return !(catalogCode === 'CPE' && ['wotquenne', 'wq', 'helm', 'h'].includes(normalizedField));

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
            default: return field
        }
    }

    function goTo(target: number) {
        setPage(Math.min(Math.max(1, target), totalPages))
    }

    function clearFilters() {
        setSearch('')
        setTypeFilter('')
        setKeyFilter('')
        setPage(1)
    }

    return <>
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                    <Search size={16} className="shrink-0 text-slate-400"/>
                    <input
                        value={search}
                        onChange={event => {
                            setSearch(event.target.value)
                            setPage(1)
                        }}
                        placeholder={t('works.searchPlaceholder')}
                        className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                    {search && (
                        <button type="button" onClick={() => {
                            setSearch('')
                            setPage(1)
                        }} aria-label={t('common.clear')} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                            <X size={16}/>
                        </button>
                    )}
                </label>
                {hasTypeColumn && <Select value={typeFilter || ALL_TYPES_VALUE} onValueChange={value => {
                    setTypeFilter(value === ALL_TYPES_VALUE || value === null ? '' : value)
                    setPage(1)
                }}>
                    <SelectTrigger className="h-11 sm:w-48">
                        <span className="shrink-0 text-xs text-muted-foreground">{t('works.type')}</span>
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectPortal>
                        <SelectPositioner sideOffset={4}>
                            <SelectPopup>
                                <SelectGroup>
                                    <SelectItem value={ALL_TYPES_VALUE}>{t('works.allTypes')}</SelectItem>
                                    {types.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                </SelectGroup>
                            </SelectPopup>
                        </SelectPositioner>
                    </SelectPortal>
                </Select>}
                {hasKeyColumn && <Select value={keyFilter || ALL_KEYS_VALUE} onValueChange={value => {
                    setKeyFilter(value === ALL_KEYS_VALUE || value === null ? '' : value)
                    setPage(1)
                }}>
                    <SelectTrigger className="h-11 sm:w-48">
                        <span className="shrink-0 text-xs text-muted-foreground">{t('works.key')}</span>
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectPortal>
                        <SelectPositioner sideOffset={4}>
                            <SelectPopup>
                                <SelectGroup>
                                    <SelectItem value={ALL_KEYS_VALUE}>{t('works.allKeys')}</SelectItem>
                                    {keys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                                </SelectGroup>
                            </SelectPopup>
                        </SelectPositioner>
                    </SelectPortal>
                </Select>}
                {hasFilters && (
                    <button type="button" onClick={clearFilters} className="h-11 shrink-0 rounded-xl border border-slate-200 px-3 text-sm text-slate-600 hover:bg-slate-50">
                        {t('works.clearFilters')}
                    </button>
                )}
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{t('works.resultsCount', {count: filteredWorks.length})}</span>
                {filteredWorks.length > PAGE_SIZE && (
                <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                disabled={currentPage <= 1}
                                onClick={() => goTo(currentPage - 1)}
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                disabled={currentPage >= totalPages}
                                onClick={() => goTo(currentPage + 1)}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
                )}
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="table-fixed w-full text-left text-sm">
                <thead
                    className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                    {hasCatalogueColumn && <th className="w-35 px-5 py-4 text-center">{catalogueHeader}</th>}
                    {catalogCode === 'CPE' && <th className="w-27.5 px-4 py-4 text-center">{t('works.helm')}</th>}
                    {hasOpusColumn && catalogCode !== 'CPE' && <th className="w-27.5 px-4 py-4 text-center">{t('works.opus')}</th>}
                    {hasDateColumn && <th className="w-22.5 px-4 py-4 text-center">{t('works.date')}</th>}
                    {hasTitleColumn && <th className="min-w-60 px-4 py-4 text-center">{t('works.titleColumn')}</th>}
                    {hasTypeColumn && <th className="w-32.5 px-4 py-4 text-center">{t('works.type')}</th>}
                    {hasKeyColumn && <th className="w-32.5 px-4 py-4 text-center">{t('works.key')}</th>}
                    <th className="w-12 px-2 py-4 text-center"><span className="sr-only">{t('works.details')}</span></th>
                </tr>
                </thead>
                <tbody>{rows.map(work => <Dialog.Root key={work.workId}>
                    <tr className="border-b border-slate-100 last:border-0 hover:bg-blue-50/50">
                    {hasCatalogueColumn && <td className="px-5 py-4 font-semibold text-blue-700 text-center">
                        <Dialog.Trigger
                            className="max-w-full hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            aria-label={`${t('works.viewDetails')}: ${work.catalogue}`}
                        >
                            {work.catalogue}
                        </Dialog.Trigger>
                    </td>}
                    {catalogCode === 'CPE' && <td className="whitespace-nowrap px-4 py-4 text-slate-600 text-center">{work.secondaryCatalogue}</td>}
                    {hasOpusColumn && catalogCode !== 'CPE' && <td className="whitespace-nowrap px-4 py-4 text-slate-600 text-center">{work.opus}</td>}
                    {hasDateColumn && <td className="whitespace-nowrap px-4 py-4 text-slate-600 text-center">{work.date}</td>}
                    {hasTitleColumn && <td className="truncate px-4 py-4 font-medium text-slate-900 text-center" title={work.title}>
                        <Dialog.Trigger
                            className="max-w-full truncate hover:text-blue-700 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            aria-label={`${t('works.viewDetails')}: ${work.title || work.catalogue}`}
                        >
                            {work.title}
                        </Dialog.Trigger>
                    </td>}
                    {hasTypeColumn && <td className="whitespace-nowrap px-4 py-4 text-slate-600 text-center">{work.type}</td>}
                    {hasKeyColumn && <td className="whitespace-nowrap px-4 py-4 text-slate-600 text-center">{work.key}</td>}
                    <td className="px-2 py-2 text-center">
                        <Dialog.Trigger
                            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            aria-label={`${t('works.viewDetails')}: ${work.title || work.catalogue}`}
                        >
                            <Info aria-hidden="true"/>
                        </Dialog.Trigger>
                    </td>
                    </tr>
                    <Dialog.Portal>
                        <Dialog.Backdrop className="fixed inset-0 bg-black/40 transition-opacity data-ending-style:opacity-0"/>
                        <Dialog.Popup className="fixed left-1/2 top-1/2 flex max-h-[min(85vh,48rem)] w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl outline-none">
                            <div className="border-b border-slate-200 p-5">
                                <Dialog.Title className="heading text-xl font-semibold text-slate-950">
                                    {work.title || work.type || work.catalogue || t('works.details')}
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
                                                        title={`${work.title || work.catalogue} on Spotify`}
                                                        src={spotifyEmbedUrl}
                                                        width="100%"
                                                        height={spotifyEmbedUrl.includes('/track/') || spotifyEmbedUrl.includes('/episode/') ? 152 : 352}
                                                        loading="lazy"
                                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                        referrerPolicy="strict-origin-when-cross-origin"
                                                        className="max-w-full rounded-lg border-0"
                                                    />
                                                ) : (
                                                    <span className="whitespace-pre-wrap wrap-break-word">{value}</span>
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
                </Dialog.Root>)}{filteredWorks.length === 0 ? <tr><td colSpan={columnCount} className="px-5 py-12 text-center text-sm text-slate-500">{t('works.noWorks')}</td></tr> : Array.from({length: blankRows}).map((_, index) => <tr key={`blank-${index}`} aria-hidden="true"
                                                                              className="border-b border-slate-100 last:border-0"><td
                    colSpan={columnCount} className="px-5 py-4">&nbsp;</td></tr>)}</tbody>
            </table>
        </div>
    </>
}
