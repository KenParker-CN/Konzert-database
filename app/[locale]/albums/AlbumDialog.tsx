'use client'

import {Fragment, useEffect, useState} from 'react'
import {X} from 'lucide-react'
import type {Album} from '@/lib/db/albums'
import type {ReleaseTracklist} from '@/lib/db/recordings'
import {useI18n} from '@/lib/i18n/client'
import {localePath} from '@/lib/i18n/config'
import TracklistPanel from './TracklistPanel'
import MarqueeText from '@/components/common/MarqueeText'

/** Album credits become links when the name matches an artist in the database. */
export function LinkedNames({names, slugMap, page = 'artists'}: { names: string[]; slugMap: Record<string, string>; page?: 'artists' | 'composers' }) {
    const {locale} = useI18n()
    if (!names.length) return <>—</>
    return <span className="inline">
        {names.map((name, index) => {
            const slug = slugMap[name]
            return <Fragment key={`${name}-${index}`}>
                {index > 0 && <span>, </span>}
                {slug
                    ? <a href={localePath(locale, `/${page}/${slug}`)}
                         className="font-medium text-blue-700 underline-offset-2 hover:underline">{name}</a>
                    : <span>{name}</span>}
            </Fragment>
        })}
    </span>
}

/** Recording detail dialog shared by the Recordings grid and the Related-albums carousel. */
export default function AlbumDialog({album, onClose, slugMap, tracklists = {}}: {
    album: Album | null
    onClose: () => void
    slugMap: Record<string, string>
    tracklists?: Record<string, ReleaseTracklist>
}) {
    const {t} = useI18n()
    const [expandedId, setExpandedId] = useState<number | null>(null)

    useEffect(() => {
        if (!album) return
        const original = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = original }
    }, [album])

    if (!album) return null
    const tracklist = tracklists[album.title] ?? null
    const labels = {
        tracklist: t('recordings.tracklist'),
        tracklistUnavailable: t('recordings.tracklistUnavailable'),
        recordingInfo: t('recordings.recordingInfo'),
        recordingTitle: t('recordings.recordingTitle'),
        recordingDate: t('recordings.recordingDate'),
        performers: t('recordings.performers'),
        relatedWorks: t('recordings.relatedWorks'),
        disc: t('recordings.disc'),
    }
    return <div role="dialog" aria-modal="true" aria-label={album.title}
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-5">
        <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-5 shrink-0">
                <div className="min-w-0">
                    <MarqueeText className="heading text-2xl font-semibold text-slate-950">{album.title}</MarqueeText>
                    <p className="mt-1 text-xs text-slate-400">
                        {[album.year, album.label, album.catalogueNumber].filter(Boolean).join(' · ') || '—'}
                    </p>
                </div>
                <button type="button" onClick={onClose}
                        className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100"
                        aria-label={t('common.close')}><X size={19} aria-hidden="true"/></button>
            </div>
            <div className="mt-6 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto scrollbar-thin lg:flex-row lg:overflow-hidden">
                <div className="flex shrink-0 flex-col items-center gap-4 lg:items-start">
                    <div className="h-72 w-72 shrink-0 overflow-hidden rounded-xl bg-slate-100">{album.cover &&
                        <img src={album.cover} alt="" className="h-full w-full object-cover"/>}</div>
                    <div className="w-72 flex flex-col gap-2 text-sm">
                        <div className="flex items-baseline gap-2">
                            <span className="shrink-0 text-slate-400">{t('recordings.composers')}</span>
                            <MarqueeText className="text-slate-700">
                                <LinkedNames names={album.composers} slugMap={slugMap} page="composers"/>
                            </MarqueeText>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="shrink-0 text-slate-400">{t('recordings.artists')}</span>
                            <MarqueeText className="text-slate-700">
                                <LinkedNames names={album.artists} slugMap={slugMap}/>
                            </MarqueeText>
                        </div>
                    </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <TracklistPanel tracklist={tracklist} expandedId={expandedId}
                                    onToggle={entryId => setExpandedId(current => current === entryId ? null : entryId)}
                                    labels={labels}/>
                </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4 shrink-0">{album.spotify &&
                <a className="rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
                   href={album.spotify} target="_blank" rel="noreferrer">Spotify</a>}{album.appleMusic &&
                <a className="rounded-lg bg-pink-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-pink-700"
                   href={album.appleMusic} target="_blank" rel="noreferrer">Apple Music</a>}{album.tidal &&
                <a className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700"
                   href={album.tidal} target="_blank" rel="noreferrer">Tidal</a>}</div>
        </div>
    </div>
}
