'use client'

import {useEffect, useMemo, useRef, type ReactNode} from 'react'
import Link from 'next/link'
import type {getCatalogueDirectory} from '@/lib/db/composers'
import {localePath, type Locale} from '@/lib/i18n/config'
import {useI18n} from '@/lib/i18n/client'
import useAutoHideScrollbar from '@/components/hooks/useAutoHideScrollbar'

type CatalogueEntry = Awaited<ReturnType<typeof getCatalogueDirectory>>[number]

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function getSortInitial(name: string): string {
    const trimmed = name.trim()
    if (!trimmed) return '#'
    const first = trimmed[0].toUpperCase()
    return ALPHABET.includes(first) ? first : '#'
}

export default function CatalogueWorkspace({
    catalogues,
    currentCatalogue,
    locale,
    children,
}: {
    catalogues: CatalogueEntry[]
    currentCatalogue: string
    locale: Locale
    children: ReactNode
}) {
    const {t} = useI18n()
    const navRef = useRef<HTMLElement>(null)
    const scrollStorageKey = `catalogue-navigation-scroll:${locale}`
    const scrollbar = useAutoHideScrollbar()

    const sortedCatalogues = useMemo(() => {
        return [...catalogues].sort((left, right) =>
            (left.composerNameSort || left.composerName).localeCompare(
                right.composerNameSort || right.composerName,
                undefined,
                {numeric: true, sensitivity: 'base'},
            ),
        )
    }, [catalogues])

    const activeLetter = useMemo(() => {
        const activeEntry = sortedCatalogues.find(entry => entry.catalogue === currentCatalogue)
        if (!activeEntry) return ''
        return getSortInitial(activeEntry.composerNameSort || activeEntry.composerName)
    }, [sortedCatalogues, currentCatalogue])

    useEffect(() => {
        const savedScrollTop = Number(sessionStorage.getItem(scrollStorageKey))
        if (Number.isFinite(savedScrollTop) && navRef.current) {
            navRef.current.scrollTop = savedScrollTop
        }
    }, [scrollStorageKey])

    function jumpToLetter(letter: string) {
        const list = navRef.current?.querySelector('ul')
        const nav = navRef.current
        if (!list || !nav) return
        const items = Array.from(list.querySelectorAll(`li[data-letter="${letter}"]`)) as HTMLElement[]
        const target = items[0]
        if (!target) return
        const navRect = nav.getBoundingClientRect()
        const top = target.getBoundingClientRect().top - navRect.top + nav.scrollTop
        nav.scrollTo({top, behavior: 'auto'})
        sessionStorage.setItem(scrollStorageKey, String(top))
        const anchor = target.querySelector('a') as HTMLAnchorElement | null
        anchor?.click()
    }

    return (
        <div className="mx-auto flex h-[calc(100dvh-4rem)] min-h-0 max-w-360 flex-col md:flex-row">
            <aside className="flex h-52 min-h-0 shrink-0 flex-col border-b border-slate-200 bg-white md:h-full md:w-72 md:border-b-0 md:border-r">
                <div className="flex h-12 shrink-0 items-center px-3">
                    <h2 className="truncate text-sm font-semibold text-slate-800">{t('catalogues.title')}</h2>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1 border-b border-slate-100 px-2 py-2">
                    {ALPHABET.split('').map(letter => {
                        const hasEntries = sortedCatalogues.some(
                            entry => getSortInitial(entry.composerNameSort || entry.composerName) === letter,
                        )
                        return (
                            <button
                                key={letter}
                                type="button"
                                disabled={!hasEntries}
                                onClick={() => jumpToLetter(letter)}
                                className={`flex h-6 w-6 items-center justify-center rounded text-xs font-medium transition-colors ${
                                    activeLetter === letter
                                        ? 'bg-blue-600 text-white'
                                        : hasEntries
                                            ? 'text-slate-600 hover:bg-slate-100'
                                            : 'text-slate-300'
                                }`}
                                aria-label={letter}
                            >
                                {letter}
                            </button>
                        )
                    })}
                </div>
                <nav
                    ref={navRef}
                    aria-label={t('catalogues.allCatalogues')}
                    className={`${scrollbar.className} min-h-0 flex-1 overflow-y-auto px-2 pb-2`}
                    onScroll={event => {
                        scrollbar.onScroll()
                        sessionStorage.setItem(scrollStorageKey, String(event.currentTarget.scrollTop))
                    }}
                >
                    <ul className="flex flex-col gap-1">
                        {sortedCatalogues.map(entry => {
                            const label = entry.composerNameSort || entry.composerName
                            const active = entry.catalogue === currentCatalogue
                            return (
                                <li key={entry.catalogue} data-letter={getSortInitial(label)}>
                                    <Link
                                        href={localePath(locale, `/catalogues/${entry.catalogue}`)}
                                        aria-current={active ? 'page' : undefined}
                                        className={`block rounded-md px-2.5 py-2 text-sm leading-5 transition-colors ${active ? 'bg-blue-50 font-semibold text-blue-700' : 'font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950'}`}
                                    >
                                        <span className="block truncate">{label}</span>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>
            </aside>
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    )
}