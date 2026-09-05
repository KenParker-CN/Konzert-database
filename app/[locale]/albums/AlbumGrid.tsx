'use client'

import { FormEvent, useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Album } from '../../../lib/db/albums'
import type { ReleaseTracklist } from '../../../lib/db/recordings'
import { useI18n } from '../../../lib/i18n/client'
import AlbumDialog from './AlbumDialog'
import { useTableSort } from '@/lib/hooks/useTableSort'
import MarqueeText from '@/components/common/MarqueeText'

type SortKey = 'title' | 'artist' | 'year' | 'catalogue'

const sortLabels: Record<SortKey, string> = {
    title: 'recordings.sortTitleAsc',
    artist: 'recordings.sortArtistAsc',
    year: 'recordings.sortYearAsc',
    catalogue: 'recordings.sortCatalogueAsc',
}

// Default sort for albums: by title ascending
const defaultSort = [
    { key: 'title' as const, direction: 'asc' as const },
]

export default function AlbumGrid({ albums, search, slugMap, tracklists = {} }: {
    albums: Album[]
    search: string
    slugMap: Record<string, string>
    tracklists?: Record<string, ReleaseTracklist>
}) {
    const { t } = useI18n()
    const [selected, setSelected] = useState<Album | null>(null)

    const { sortFields, toggleSort, resetSort, sortData, getSortState, isCustomSort } = useTableSort<Album, SortKey>(
        { defaultSort },
        (album, key) => {
            if (key === 'artist') return album.composers.join(', ') || album.artists.join(', ') || ''
            if (key === 'catalogue') return album.catalogueNumber ?? ''
            return album[key] ?? ''
        },
    )

    const sortedAlbums = useMemo(() => sortData(albums), [albums, sortData])

    const router = useRouter(), pathname = usePathname() ?? '/'
    const [pending, startTransition] = useTransition()

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const value = String(new FormData(event.currentTarget).get('search') || '').trim()
        startTransition(() => router.push(value ? `${pathname}?search=${encodeURIComponent(value)}` : pathname))
    }

    const countLabel = albums.length === 1
        ? t('recordings.count_one', { count: albums.length })
        : t('recordings.count', { count: albums.length })

    return <>
        <form onSubmit={submit}>
            <Field orientation="horizontal">
                <Input name="search" defaultValue={search} placeholder={t('recordings.searchPlaceholder')} />
                <Button type="submit" disabled={pending}>
                    {pending ? t('common.searching') : t('common.search')}
                </Button>
            </Field>
        </form>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{t('recordings.sortBy')}</span>
                <div className="flex flex-wrap gap-1">
                    {(Object.keys(sortLabels) as SortKey[]).map(key => {
                        const sortState = getSortState(key)
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => toggleSort(key)}
                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors ${
                                    sortState.active
                                        ? 'bg-blue-100 text-blue-700 font-medium'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {t(sortLabels[key])}
                                {sortState.active && (
                                    <span className="text-[10px]">
                                        {sortState.direction === 'asc' ? '▲' : '▼'}
                                        {sortState.priority !== null && sortState.priority > 1 && (
                                            <sup className="ml-0.5">{sortState.priority}</sup>
                                        )}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                    {isCustomSort && (
                        <button
                            type="button"
                            onClick={resetSort}
                            className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-200"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>
            <div className="flex gap-4 text-sm text-slate-500">
                <span>{countLabel}</span>
                <span>{t('recordings.pageInfo', { current: 1, total: 1 })}</span>
            </div>
        </div>
        <div
            className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {sortedAlbums.map(album => (
                <button key={album.id} type="button" onClick={() => setSelected(album)}
                        className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left shadow-sm hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-200">
                    {album.cover ? (
                        <img src={album.cover} alt={album.title}
                             className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                            {t('recordings.noCover')}
                        </div>
                    )}
                    <div
                        className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent p-4 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                        <span
                            className="mb-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-800"
                            aria-hidden="true"><Info size={16} strokeWidth={2.5} /></span>
                        <MarqueeText className="heading text-sm font-semibold">{album.title}</MarqueeText>
                        <MarqueeText className="mt-1 text-xs text-white/80">
                            {album.composers.join(', ') || album.artists.join(', ') || t('recordings.unknownArtist')}
                        </MarqueeText>
                    </div>
                    <span className="sr-only">{t('recordings.viewDetails', { title: album.title })}</span>
                </button>
            ))}
        </div>
        {!albums.length && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">
                {t('recordings.noRecordings')}
            </div>
        )}
        {selected && (
            <AlbumDialog key={selected.id} album={selected} onClose={() => setSelected(null)} slugMap={slugMap}
                         tracklists={tracklists} />
        )}
    </>
}