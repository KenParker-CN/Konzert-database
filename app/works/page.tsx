import WorkExplorer from './WorkExplorer'
import { getWorkFilterOptions, getWorks, type WorkFilters } from '../../lib/db/works'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input
}

export default async function WorksPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams
  const filters: WorkFilters = {
    search: value(query.search),
    catalogue: value(query.catalogue),
    type: value(query.type),
    key: value(query.key),
    instrumentation: value(query.instrumentation),
  }
  const [works, options] = await Promise.all([getWorks(filters), getWorkFilterOptions()])

  return <main className="min-h-screen"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-10"><a href="/" className="heading text-lg font-semibold tracking-tight">Parker’s</a><nav className="flex items-center gap-5 text-sm text-slate-600"><a href="/works" className="font-semibold text-blue-600">Works</a><a href="/pages/composers" className="hidden hover:text-slate-950 sm:block">Composers</a><a href="/pages/albums" className="hidden hover:text-slate-950 sm:block">Collections</a></nav></div></header><div className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10 lg:py-14"><div className="mb-8 max-w-2xl"><div className="mb-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Classical music archive</div><h1 className="heading text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Works</h1><p className="mt-3 text-base leading-7 text-slate-600">Explore the unified work database, with catalogue details and composer relationships resolved from the archive.</p></div><WorkExplorer works={works} options={options} /></div></main>
}
