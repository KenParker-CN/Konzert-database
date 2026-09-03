import AppShell from '../../components/AppShell'
import PageHeader from '../../components/PageHeader'
import ComposerDirectory from './ComposerDirectory'
import { getComposers } from '../../lib/db/composers'

export const dynamic = 'force-dynamic'
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function ComposersPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams
  const search = Array.isArray(query.search) ? query.search[0] : query.search
  const composers = getComposers(search)
  return <AppShell active="composers"><main className="min-h-screen"><div className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10 lg:py-14"><PageHeader badge="People in the archive" title="Composers" description="Find composers and follow their connected works through the archive." /><ComposerDirectory composers={composers} search={search ?? ''} /></div></main></AppShell>
}
