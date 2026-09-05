'use client'

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { FormEvent, useTransition, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Artist } from '@/lib/db/artists'
import { useI18n } from '@/lib/i18n/client'
import { localePath } from '@/lib/i18n/config'
import MarqueeText from '@/components/common/MarqueeText'

function artistSlug(name: string) { return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export default function ArtistDirectory({ artists, search, categories, selectedCategory }: {
  artists: Artist[]
  search: string
  categories: string[]
  selectedCategory: string
}) {
  const router = useRouter(), pathname = usePathname() ?? '/', [pending, startTransition] = useTransition()
  const { locale, t } = useI18n()
  const searchInputRef = useRef<HTMLInputElement>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const searchValue = String(new FormData(event.currentTarget).get('search') || '').trim()

    const params = new URLSearchParams()
    if (searchValue) params.set('search', searchValue)
    if (selectedCategory) params.set('category', selectedCategory)

    startTransition(() => router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname))
  }

  function setCategory(category: string) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category) params.set('category', category)

    startTransition(() => router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname))
  }

  return (
    <>
      <div className="max-w-xl">
        <form onSubmit={submit}>
          <Field orientation="horizontal">
            <Input
              ref={searchInputRef}
              name="search"
              defaultValue={search}
              placeholder={t('artists.searchPlaceholder')}
              autoFocus
            />
            <Button type="submit" disabled={pending}>
              {pending ? t('common.searching') : t('common.search')}
            </Button>
          </Field>
        </form>
      </div>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              !selectedCategory
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('artists.all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex justify-between text-sm text-slate-500">
        <span>{t('artists.count', { count: artists.length })}</span>
        <span>{t('works.pageInfo', { current: 1, total: 1 })}</span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {artists.map(artist => (
          <a key={artist.artistId} href={localePath(locale, `/artists/${artistSlug(artist.name)}`)} className="group flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-base font-semibold text-emerald-700">{artist.name.slice(0, 1)}</div>
            <div className="min-w-0">
              <MarqueeText className="heading text-base font-semibold text-slate-950">{artist.name}</MarqueeText>
              <MarqueeText className="mt-1 text-sm leading-5 text-slate-500">{artist.biography || t('artists.noIntroduction')}</MarqueeText>
            </div>
          </a>
        ))}
      </div>
      {!artists.length && <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">{t('artists.noArtists')}</div>}
    </>
  )
}
