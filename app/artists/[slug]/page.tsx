import AppShell from '../../../components/AppShell'
import { getArtist, getArtistWorks } from '../../../lib/db/artists'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ArtistDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const artist = getArtist(slug)
  if (!artist) notFound()
  const works = getArtistWorks(artist.artistId)
  return <AppShell active="artists"><main className="min-h-screen"><div className="mx-auto max-w-[1200px] px-5 py-10 lg:px-10 lg:py-14"><a href="/artists" className="text-sm font-semibold text-blue-600">← All artists</a><section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-5"><div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl font-semibold text-emerald-700">{artist.name.slice(0, 1)}</div><div><h1 className="heading text-3xl font-semibold tracking-tight text-slate-950">{artist.name}</h1><p className="mt-2 text-sm text-slate-500">{artist.startDate || artist.endDate ? `${artist.startDate ?? '?'}–${artist.endDate ?? ''}` : artist.type}</p></div></div>{artist.biography && <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600">{artist.biography}</p>}</section><section className="mt-7 rounded-2xl border border-slate-200 bg-slate-50/70 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Wikipedia</p><p className="mt-1 text-sm text-slate-600">Short introduction will appear here.</p><a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(artist.name.replace(/ /g, '_'))}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-blue-600">Read on Wikipedia ↗</a></section><section className="mt-8"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Associated records</p><h2 className="heading mt-1 text-2xl font-semibold">Works</h2><div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="divide-y divide-slate-100">{works.map(work => <div key={work.workId} className="flex items-center justify-between gap-4 px-5 py-4 text-sm"><span className="font-semibold text-blue-700">{work.catalogue}</span><span className="flex-1 font-medium text-slate-800">{work.title}</span><span className="text-slate-500">{work.type || '—'}</span></div>)}</div>{!works.length && <p className="p-8 text-center text-sm text-slate-500">No associated works.</p>}</div></section></div></main></AppShell>
}
