import AppShell from '../../components/AppShell'
import AlbumGrid from './AlbumGrid'
import { getAlbums } from '../../lib/db/albums'

export const dynamic = 'force-dynamic'
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AlbumsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams
  const search = Array.isArray(query.search) ? query.search[0] : query.search
  const albums = getAlbums(search)
  return <AppShell active="albums"><main className="min-h-screen"><div className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10 lg:py-14"><div className="mb-8 max-w-2xl"><div className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Listening collection</div><h1 className="heading text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Albums</h1><p className="mt-3 text-base leading-7 text-slate-600">Browse recordings, performers, labels, and listening links from the collection.</p></div><AlbumGrid albums={albums} search={search ?? ''} /></div></main></AppShell>
}
