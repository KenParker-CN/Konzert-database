'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Album } from '@/lib/db/albums'
import type { ReleaseTracklist } from '@/lib/db/recordings'
import { useI18n } from '@/lib/i18n/client'
import { localePath } from '@/lib/i18n/config'
import AlbumDialog from '../albums/AlbumDialog'
import MarqueeText from '@/components/common/MarqueeText'

/** Horizontal snap carousel of album covers that reference this artist. Clicking an item opens the shared recording dialog. */
export default function RelatedAlbums({ albums, slugMap, tracklists = {} }: {
    albums: Album[]
    slugMap: Record<string, string>
    tracklists?: Record<string, ReleaseTracklist>
}) {
    const { t, locale } = useI18n()
    const trackRef = useRef<HTMLDivElement>(null)
    const [selected, setSelected] = useState<Album | null>(null)
    const [canPrev, setCanPrev] = useState(false)
    const [canNext, setCanNext] = useState(false)

    const update = useCallback(() => {
        const track = trackRef.current
        if (!track) return
        setCanPrev(track.scrollLeft > 4)
        setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4)
    }, [])

    useEffect(() => {
        update()
        const track = trackRef.current
        if (!track) return
        track.addEventListener('scroll', update, { passive: true })
        window.addEventListener('resize', update)
        return () => {
            track.removeEventListener('scroll', update)
            window.removeEventListener('resize', update)
        }
    }, [update])

    function scrollBy(direction: 1 | -1) {
        const track = trackRef.current
        if (!track) return
        track.scrollBy({ left: direction * Math.max(track.clientWidth * 0.8, 200), behavior: 'smooth' })
    }

    const sorted = [...albums].sort((a, b) =>
        (Number.parseInt(b.year, 10) || 0) - (Number.parseInt(a.year, 10) || 0) || a.title.localeCompare(b.title))

    const arrowClass = 'flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:pointer-events-none disabled:opacity-40'

    return (
        <div>
            <div className="flex items-center justify-between gap-4">
                <h2 className="heading text-sm font-semibold uppercase tracking-wide text-slate-500">{t('artists.relatedAlbums')}</h2>
                <div className="flex gap-2">
                    <button type="button" onClick={() => scrollBy(-1)} disabled={!canPrev} aria-label={t('common.previous')} className={arrowClass}>
                        <ChevronLeft size={18} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => scrollBy(1)} disabled={!canNext} aria-label={t('common.next')} className={arrowClass}>
                        <ChevronRight size={18} aria-hidden="true" />
                    </button>
                </div>
            </div>
            <div ref={trackRef} onScroll={update}
                 className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {sorted.map(album => (
                    <button key={album.id} type="button" onClick={() => setSelected(album)}
                            className="group w-36 shrink-0 snap-start text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 focus-visible:rounded-2xl">
                        <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm transition-shadow group-hover:shadow-md">
                            {album.cover
                                ? <img src={album.cover} alt={album.title} loading="lazy"
                                       className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                : <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-wide text-slate-400">{t('recordings.noCover')}</div>}
                        </div>
                        <MarqueeText className="mt-2 text-sm font-medium leading-5 text-slate-800 group-hover:text-blue-700">{album.title}</MarqueeText>
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{album.year || '—'}{album.label ? ` · ${album.label}` : ''}</p>
                    </button>
                ))}
            </div>
            <AlbumDialog album={selected} onClose={() => setSelected(null)} slugMap={slugMap} tracklists={tracklists} />
        </div>
    )
}
