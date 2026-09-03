'use client'

import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useTransition } from 'react'
import type { Work, WorkFilterOptions } from '../../lib/db/works'

const fields = [
  ['catalogue', 'Catalogue'],
  ['type', 'Type'],
  ['key', 'Key'],
  ['instrumentation', 'Instrumentation'],
] as const

export default function WorkExplorer({ works, options }: { works: Work[]; options: WorkFilterOptions }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const query = params ?? new URLSearchParams()
  const [isPending, startTransition] = useTransition()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    for (const [key] of [['search'], ...fields]) {
      const value = String(form.get(key) || '').trim()
      if (value) next.set(key, value)
    }
    startTransition(() => router.push(`${pathname}${next.toString() ? `?${next}` : ''}`))
  }

  return <>
    <form className="flex w-full flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={submit}>
      <label className="relative min-w-[min(100%,240px)] flex-[2_1_320px]">
        <span className="sr-only">Search works</span>
        <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400"><Search size={16} aria-hidden="true" /></span>
        <input name="search" defaultValue={query.get('search') ?? ''} placeholder="Search works…" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
      </label>
      {fields.map(([key, label]) => <label key={key} className="min-w-[160px] flex-1"><span className="sr-only">{label}</span><select name={key} defaultValue={query.get(key) ?? ''} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="">{label}</option>{options[key].map(value => <option key={value} value={value}>{value}</option>)}</select></label>)}
      <button type="submit" className="h-10 shrink-0 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 sm:col-span-2 lg:col-span-1">Apply filters</button>
    </form>
    <div className="mt-5 flex items-center justify-between text-sm text-slate-500"><span>{isPending ? 'Updating…' : `${works.length} ${works.length === 1 ? 'work' : 'works'}`}</span><span>Page 1 of 1</span></div>
    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1040px] w-full border-collapse text-left text-sm">
          <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><th className="sticky left-0 z-10 bg-slate-50 px-5 py-4 font-semibold">Catalogue</th><th className="px-4 py-4 font-semibold">No.</th><th className="min-w-[280px] px-4 py-4 font-semibold">Title</th><th className="px-4 py-4 font-semibold">Composer</th><th className="px-4 py-4 font-semibold">Type</th><th className="px-4 py-4 font-semibold">Key</th><th className="min-w-[320px] px-4 py-4 font-semibold">Instrumentation</th></tr></thead>
          <tbody>{works.map(work => <tr key={work.workId} className="group border-b border-slate-100 last:border-0 hover:bg-blue-50/50"><td className="sticky left-0 bg-white px-5 py-4 font-semibold text-blue-700 group-hover:bg-blue-50/50">{work.catalogue || '—'}</td><td className="whitespace-nowrap px-4 py-4 text-slate-600">{work.number || '—'}</td><td className="px-4 py-4 font-medium text-slate-900">{work.title}</td><td className="whitespace-nowrap px-4 py-4 text-slate-700">{work.composer}</td><td className="whitespace-nowrap px-4 py-4 text-slate-600">{work.type || '—'}</td><td className="whitespace-nowrap px-4 py-4 text-slate-600">{work.key || '—'}</td><td className="max-w-md px-4 py-4 text-slate-600">{work.instrumentation || '—'}</td></tr>)}</tbody>
        </table>
      </div>
      {!works.length && <div className="px-6 py-14 text-center text-sm text-slate-500">No works match these filters.</div>}
    </div>
  </>
}
