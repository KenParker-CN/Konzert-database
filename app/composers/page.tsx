import AppShell from '../../components/AppShell'
import ComposerDirectory from './ComposerDirectory'
import { getComposers } from '../../lib/db/composers'

export const dynamic = 'force-dynamic'
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function ComposersPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams
  const search = Array.isArray(query.search) ? query.search[0] : query.search
  const composers = getComposers(search)
  return <AppShell active="composers"><main className="min-h-screen"><div className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10 lg:py-14"><div className="mb-8 max-w-2xl"><div className="mb-3 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">People in the archive</div><h1 className="heading text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Composers</h1><p className="mt-3 text-base leading-7 text-slate-600">Find composers and follow their connected works through the archive.</p></div><ComposerDirectory composers={composers} search={search ?? ''} /></div></main></AppShell>
}
