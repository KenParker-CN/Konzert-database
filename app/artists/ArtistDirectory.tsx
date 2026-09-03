'use client'

import { FormEvent, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Artist } from '../../lib/db/artists'

function artistSlug(name: string) { return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export default function ArtistDirectory({ artists, search }: { artists: Artist[]; search: string }) {
  const router = useRouter(), pathname = usePathname() ?? '/', [pending, startTransition] = useTransition()
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const value = String(new FormData(event.currentTarget).get('search') || '').trim(); startTransition(() => router.push(value ? `${pathname}?search=${encodeURIComponent(value)}` : pathname)) }
  return <><form onSubmit={submit} className="flex max-w-xl gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><label className="relative flex-1"><span className="sr-only">Search artists</span><span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">⌕</span><input name="search" defaultValue={search} placeholder="Search artists…" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label><button className="rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700" type="submit">{pending ? 'Searching…' : 'Search'}</button></form><div className="mt-5 flex justify-between text-sm text-slate-500"><span>{artists.length} artists</span><span>Page 1 of 1</span></div><div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{artists.map(artist => <a key={artist.artistId} href={`/artists/${artistSlug(artist.name)}`} className="group flex min-w-0 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow-md"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-base font-semibold text-emerald-700">{artist.name.slice(0, 1)}</div><div className="min-w-0"><h2 className="heading truncate text-base font-semibold text-slate-950">{artist.name}</h2><p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{artist.biography || 'No introduction available.'}</p></div></a>)}</div>{!artists.length && <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">No artists match this search.</div>}</>
}
