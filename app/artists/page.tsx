import AppShell from '../../components/AppShell'
import PageHeader from '../../components/PageHeader'
import ArtistDirectory from './ArtistDirectory'
import { getArtists } from '../../lib/db/artists'

export const dynamic = 'force-dynamic'
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function ArtistsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams
  const search = Array.isArray(query.search) ? query.search[0] : query.search
  return <AppShell active="artists"><main className="min-h-screen"><div className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10 lg:py-14"><PageHeader badge="People directory" title="Artists" description="Browse the artists represented in the connected music database." /><ArtistDirectory artists={getArtists(search)} search={search ?? ''} /></div></main></AppShell>
}
