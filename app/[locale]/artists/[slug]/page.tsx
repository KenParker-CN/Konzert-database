import AppShell from '@/components/AppShell'
import WikipediaIntro from '@/components/common/WikipediaIntro'
import RelatedAlbums from '../RelatedAlbums'
import MarqueeText from '@/components/common/MarqueeText'
import {
    getArtist,
    getArtistRecordings,
    getArtistRoles,
    getArtistSlugMap,
} from '@/lib/db/artists'
import {getAlbums} from '@/lib/db/albums'
import {getReleaseTracklists} from '@/lib/db/recordings'
import {notFound} from 'next/navigation'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import type {Translator} from '@/lib/i18n/core'

export const dynamic = 'force-dynamic'

function year(date: string | null) {
    return date?.slice(0, 4) ?? null
}

function roleLabel(role: string, t: Translator) {
    if (role === 'Composer') return t('artists.roleComposer')
    if (role === 'Performer') return t('artists.rolePerformer')
    return role // custom roles from artist_roles are data values, not UI strings
}

export default async function ArtistDetailPage({params}: { params: Promise<{ locale: string; slug: string }> }) {
    const {locale, slug} = await params
    if (!isLocale(locale)) notFound()

    const artist = await getArtist(slug)
    if (!artist) notFound()

    const roles = await getArtistRoles(artist.artistId)
    const recordings = await getArtistRecordings(artist.artistId)

    // Albums from the collection whose credits mention this artist (exact name match).
    const relatedAlbums = (await getAlbums()).filter(album =>
        album.composers.includes(artist.name) || album.artists.includes(artist.name))
    const slugMap = await getArtistSlugMap()
    const tracklists = await getReleaseTracklists()

    const {t} = await getI18n(locale)

    const start = year(artist.startDate)
    const end = year(artist.endDate)
    const lifespan = start || end ? `${start ?? '?'}–${end ?? ''}` : null

    return (
        <AppShell active="artists">
            <main className="min-h-screen">
                <div className="mx-auto max-w-[1200px] px-5 py-10 lg:px-10 lg:py-14">
                    <a href={localePath(locale, '/artists')}
                       className="text-sm font-semibold text-blue-600">← {t('artists.allArtists')}</a>

                    {/* Person information */}
                    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
                            <div className="flex shrink-0 flex-col gap-5 sm:flex-row sm:items-center lg:flex-col lg:items-start lg:w-64">
                                <div
                                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl font-semibold text-emerald-700">{artist.name.slice(0, 1)}</div>
                                <div className="min-w-0">
                                    <MarqueeText className="heading text-3xl font-semibold tracking-tight text-slate-950">{artist.name}</MarqueeText>
                                    <p className="mt-2 text-sm text-slate-500">
                                        {lifespan ?? artist.type}
                                    </p>
                                    {roles.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {roles.map((role: string) => (
                                                <span key={role}
                                                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{roleLabel(role, t)}</span>
                                            ))}
                                        </div>
                                    )}
                                    {artist.biography && (
                                        <p className="mt-4 text-base leading-7 text-slate-600">{artist.biography}</p>
                                    )}
                                </div>
                            </div>

                            {/* Wikipedia introduction (client-fetched) - moved to right side */}
                            <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                                <WikipediaIntro name={artist.name}/>
                            </div>
                        </div>
                    </section>

                    {/* Related albums carousel (only when the collection mentions this artist) - moved to bottom */}
                    {relatedAlbums.length > 0 && (
                        <section className="mt-7">
                            <RelatedAlbums albums={relatedAlbums} slugMap={slugMap} tracklists={tracklists}/>
                        </section>
                    )}

                    {/* Recordings (only rendered when data exists) */}
                    {recordings.length > 0 && (
                        <section className="mt-8">
                            <div className="mb-3">
                                <h2 className="heading text-2xl font-semibold">{t('recordings.recordingsHeading')}</h2>
                            </div>
                            <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                {recordings.map(recording => (
                                    <li key={recording.recordingId}
                                        className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 text-sm last:border-0">
                                        <span className="font-medium text-slate-900">{recording.title}</span>
                                        <span
                                            className="shrink-0 text-slate-500">{recording.recordingDate ? recording.recordingDate.slice(0, 4) : '—'}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    </div>
            </main>
        </AppShell>
    )
}