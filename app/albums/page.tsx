import AppShell from '../../components/AppShell'
import PageHeader from '../../components/PageHeader'
import AlbumGrid from './AlbumGrid'
import { getAlbums } from '../../lib/db/albums'

export const dynamic = 'force-dynamic'
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AlbumsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams
  const search = Array.isArray(query.search) ? query.search[0] : query.search
  const albums = getAlbums(search)
  return <AppShell active="albums"><main className="min-h-screen"><div className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10 lg:py-14"><PageHeader badge="Recording database" title="Recordings" description="Browse recordings, performers, labels, and listening links from the collection." /><AlbumGrid albums={albums} search={search ?? ''} /></div></main></AppShell>
}
