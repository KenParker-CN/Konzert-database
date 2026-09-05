'use client'

import {Search, X} from 'lucide-react'
import {
    useEffect,
    useRef,
    useState,
    useTransition,
    type KeyboardEvent,
} from 'react'
import {usePathname, useRouter} from 'next/navigation'
import type {Composer} from '@/lib/db/composers'
import {
    COMPOSER_PERIODS,
    COMPOSER_YEAR_MAX,
    shortPeriodLabel,
    type ComposerPeriod,
} from '@/lib/composer-years'
import {useI18n} from '@/lib/i18n/client'
import {localePath} from '@/lib/i18n/config'
import MarqueeText from '@/components/common/MarqueeText'

const VISIBLE_PERIODS = COMPOSER_PERIODS.filter(p => p.from >= 1600)

function deriveSelectedPeriod(fromYear: number, toYear: number): string | null {
    for (const period of VISIBLE_PERIODS) {
        if (period.from === fromYear && period.to === toYear) return period.id
    }
    return null
}

export default function ComposerDirectory({composers, search, fromYear, toYear}: {
    composers: Composer[]
    search: string
    fromYear: number
    toYear: number
}) {
    const router = useRouter(), pathname = usePathname() ?? '/', [pending, startTransition] = useTransition()
    const {locale, t} = useI18n()
    const [isSearchActive, setIsSearchActive] = useState(Boolean(search))
    const [query, setQuery] = useState(search)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const selectedPeriodId = deriveSelectedPeriod(fromYear, toYear)

    useEffect(() => {
        setQuery(search)
        if (search) setIsSearchActive(true)
    }, [search])

    useEffect(() => () => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }, [])

    function periodName(period: ComposerPeriod) {
        return shortPeriodLabel(t(`composers.period.${period.id}`))
    }

    function pushParams(nextSearch: string, nextFrom = 1600, nextTo = COMPOSER_YEAR_MAX) {
        const params = new URLSearchParams()
        const trimmed = nextSearch.trim()
        if (trimmed) params.set('search', trimmed)
        if (nextFrom > 1600) params.set('from', String(nextFrom))
        if (nextTo < COMPOSER_YEAR_MAX) params.set('to', String(nextTo))
        startTransition(() => router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname))
    }

    function applySearch(next: string) {
        setQuery(next)
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = setTimeout(() => pushParams(next, fromYear, toYear), 200)
    }

    function activateSearch() {
        setIsSearchActive(true)
        requestAnimationFrame(() => searchInputRef.current?.focus())
    }

    function clearSearch() {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
        setQuery('')
        pushParams('')
        searchInputRef.current?.focus()
    }

    function exitSearch() {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
        setIsSearchActive(false)
        if (query.trim()) {
            setQuery('')
            pushParams('')
        }
    }

    function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key !== 'Escape') return
        if (query) clearSearch()
        else exitSearch()
    }

    function selectPeriod(period: ComposerPeriod) {
        pushParams(query, period.from, period.to)
    }

    function selectAll() {
        pushParams(query)
    }

    return <>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
                <div className="min-w-0 flex-1">
                    <div className="overflow-x-auto">
                        <div className="flex min-w-[360px] gap-0">
                            <button
                                type="button"
                                onClick={selectAll}
                                className={`flex h-12 shrink-0 items-center justify-center rounded-l-xl border border-r-0 px-4 text-sm font-medium transition-all ${
                                    !selectedPeriodId
                                        ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                }`}
                            >
                                {t('common.all')}
                            </button>
                            {VISIBLE_PERIODS.map((period, index) => {
                                const selected = selectedPeriodId === period.id
                                const isLast = index === VISIBLE_PERIODS.length - 1
                                return (
                                    <button
                                        key={period.id}
                                        type="button"
                                        onClick={() => selectPeriod(period)}
                                        title={`${periodName(period)} (${period.from}–${period.id === 'Contemporary' ? t('composers.period.present') : period.to})`}
                                        className={`group relative flex h-12 flex-1 items-center justify-center overflow-hidden border border-r-0 text-[11px] font-medium transition-all ${
                                            isLast ? 'rounded-r-xl border-r' : ''
                                        } ${
                                            selected
                                                ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                                                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                        }`}
                                    >
                                        <MarqueeText className="relative z-10 w-full text-center">
                                            {periodName(period)}
                                        </MarqueeText>
                                        {selected && (
                                            <div
                                                className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-20"
                                                style={{backgroundColor: '#fff'}}
                                            />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="w-full shrink-0 lg:w-72">
                    <div className="h-12 w-full">
                        {!isSearchActive ? (
                            <button
                                type="button"
                                onClick={activateSearch}
                                className="box-border flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                            >
                                <Search size={16}/>
                                <span>{t('composers.searchPlaceholder')}</span>
                            </button>
                        ) : (
                            <div className="box-border flex h-12 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
                                <Search size={16} className="shrink-0 text-slate-400"/>
                                <input
                                    ref={searchInputRef}
                                    value={query}
                                    onChange={event => applySearch(event.target.value)}
                                    onKeyDown={onSearchKeyDown}
                                    placeholder={t('composers.searchPlaceholder')}
                                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={query ? clearSearch : exitSearch}
                                    className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                    aria-label={query ? t('common.clear') : t('common.close')}
                                >
                                    <X size={16}/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
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
                            {composer.name}
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
