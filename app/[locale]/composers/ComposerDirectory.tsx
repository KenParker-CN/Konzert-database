'use client'

import {Search, X} from 'lucide-react'
import {
    useEffect,
    useRef,
    useState,
    useTransition,
} from 'react'
import {usePathname, useRouter} from 'next/navigation'
import type {Composer} from '@/lib/db/composers'
import {useI18n} from '@/lib/i18n/client'
import {localePath} from '@/lib/i18n/config'
import MarqueeText from '@/components/common/MarqueeText'

export default function ComposerDirectory({composers, search}: {
    composers: Composer[]
    search: string
}) {
    const router = useRouter(), pathname = usePathname() ?? '/', [pending, startTransition] = useTransition()
    const {locale, t} = useI18n()
    const [query, setQuery] = useState(search)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        setQuery(search)
    }, [search])

    useEffect(() => () => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }, [])

    function pushParams(nextSearch: string) {
        const params = new URLSearchParams()
        const trimmed = nextSearch.trim()
        if (trimmed) params.set('search', trimmed)
        startTransition(() => router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname))
    }

    function applySearch(next: string) {
        setQuery(next)
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = setTimeout(() => pushParams(next), 200)
    }

    function clearSearch() {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
        setQuery('')
        pushParams('')
        searchInputRef.current?.focus()
    }

    return <>
        <section>
            <div className="box-border flex h-12 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
                <Search size={16} className="shrink-0 text-slate-400"/>
                <input
                    ref={searchInputRef}
                    value={query}
                    onChange={event => applySearch(event.target.value)}
                    placeholder={t('composers.searchPlaceholder')}
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
                {query && (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        aria-label={t('common.clear')}
                    >
                        <X size={16}/>
                    </button>
                )}
            </div>
        </section>

        <div className="mt-5 flex justify-between text-sm text-slate-500">
            <span>{t('composers.count', {count: composers.length})}</span>
            <span>{pending ? t('composers.searching') : t('works.pageInfo', {current: 1, total: 1})}</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {composers.map(composer => (
                <a
                    key={composer.artistId}
                    href={localePath(locale, `/composers/${composer.slug}`)}
                    className="group flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow-md"
                >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-base font-semibold text-blue-700">
                        {composer.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                        <MarqueeText className="heading text-base font-semibold text-slate-950 group-hover:text-blue-700">
                            {composer.nameSort || composer.name}
                        </MarqueeText>
                        <MarqueeText className="mt-1 text-sm leading-5 text-slate-500">
                            {composer.biography ?? ''}
                        </MarqueeText>
                    </div>
                </a>
            ))}
        </div>
        {!composers.length && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">
                {t('composers.noComposers')}
            </div>
        )}
    </>
}
