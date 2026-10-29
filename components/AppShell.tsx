'use client'

import type {ReactNode} from 'react'
import {useCallback, useState} from 'react'
import {useRouter, useSearchParams} from 'next/navigation'
import {Dialog} from '@base-ui/react/dialog'
import {useI18n} from '@/lib/i18n/client'
import {localePath} from '@/lib/i18n/config'
import {Tooltip, TooltipTrigger, TooltipContent} from '@/components/ui/tooltip'
import {IconBooks, IconClefStaff, IconSearch, IconX} from '@tabler/icons-react'
import LanguageSelector from './LanguageSelector'
import ThemeSelector from './ThemeSelector'
import WorkDetailsDialog, {type WorkDetailsEntry} from '@/components/catalogues/WorkDetailsDialog'

type CatalogueSearchResult = {
    catalogue: string
    catalogueName: string | null
    composerName: string
    workCount: number
}

type WorkSearchResult = WorkDetailsEntry & {
    catalogueCode: string
    catalogueName: string | null
    composerName: string
    sort: string
}

type SearchResults = {
    catalogues: {total: number; results: CatalogueSearchResult[]}
    works: {total: number; results: WorkSearchResult[]}
}

export default function AppShell({children, active}: {
    children: ReactNode;
    active?: 'catalogues' | 'genres'
}) {
    const {locale, t} = useI18n()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '')
    const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
    const [searchSubmitted, setSearchSubmitted] = useState(false)
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchFailed, setSearchFailed] = useState(false)
    const links = [
        ['catalogues', 'catalogues', '/catalogues', <IconBooks size={20} className="shrink-0"/>],
        ['genres', 'genres', '/genres', <IconClefStaff size={20} className="shrink-0"/>],
    ] as const

    const runSearch = useCallback(async (value: string) => {
        const query = value.trim()
        if (!query) {
            setSearchResults(null)
            setSearchSubmitted(false)
            setSearchFailed(false)
            return
        }

        setSearchLoading(true)
        setSearchSubmitted(true)
        setSearchFailed(false)
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
            if (!response.ok) throw new Error('Search request failed')
            const data = await response.json() as SearchResults
            setSearchResults(data)
        } catch {
            setSearchResults(null)
            setSearchFailed(true)
        } finally {
            setSearchLoading(false)
        }
    }, [])

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        void runSearch(searchQuery)
    }

    const viewAllResults = (type: 'catalogues' | 'works') => {
        const query = searchQuery.trim()
        if (!query) return
        setSearchOpen(false)
        router.push(localePath(locale, `/search?q=${encodeURIComponent(query)}&type=${type}`))
    }

    const openCatalogue = (catalogue: string) => {
        setSearchOpen(false)
        router.push(localePath(locale, `/catalogues/${catalogue}`))
    }

    return <div className="app-shell" data-page={active ?? 'home'}>
        <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-360 flex-wrap items-center gap-x-8 gap-y-3 py-3">
                <a href={localePath(locale, '/')} className="heading text-lg font-semibold tracking-tight">Parker’s</a>
                <nav aria-label={t('navigation.catalogues')} className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                    {links.map(([id, key, href, icon]) =>
                        <a key={id} href={localePath(locale, href)}
                           className={`group inline-flex items-center justify-center gap-1 p-2 rounded-md ${active === id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}>
                            <Tooltip>
                                <TooltipTrigger>
                                    {icon}
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    {t(`navigation.${key}`)}
                                </TooltipContent>
                            </Tooltip>
                        </a>)}
                </nav>
                <Dialog.Root open={searchOpen} onOpenChange={open => {
                    setSearchOpen(open)
                    if (open) {
                        const currentQuery = searchParams.get('q')?.trim() ?? ''
                        if (currentQuery) {
                            setSearchQuery(currentQuery)
                            void runSearch(currentQuery)
                        }
                    }
                }}>
                    <div className="ml-auto flex items-center gap-2">
                        <LanguageSelector/>
                        <ThemeSelector/>
                        <Dialog.Trigger
                            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-transparent text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            aria-label={t('search.title')}
                            title={t('search.title')}
                        >
                            <IconSearch size={18} aria-hidden="true"/>
                        </Dialog.Trigger>
                    </div>
                    <Dialog.Portal>
                        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity data-ending-style:opacity-0"/>
                        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex h-full w-[min(28rem,100vw)] flex-col border-l border-slate-200 bg-white shadow-xl outline-none data-ending-style:translate-x-full data-starting-style:translate-x-full transition-transform duration-200">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                <Dialog.Title className="heading text-lg font-semibold text-slate-950">{t('search.title')}</Dialog.Title>
                                <Dialog.Close
                                    className="inline-flex size-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    aria-label={t('common.close')}
                                >
                                    <IconX size={18} aria-hidden="true"/>
                                </Dialog.Close>
                            </div>
                            <form onSubmit={handleSearch} className="p-5 pb-4">
                                <label htmlFor="global-search" className="sr-only">{t('search.placeholder')}</label>
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                                    <input
                                        id="global-search"
                                        name="q"
                                        autoFocus
                                        value={searchQuery}
                                        placeholder={t('search.placeholder')}
                                        onChange={event => setSearchQuery(event.currentTarget.value)}
                                        className="h-12 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                    />
                                    <button
                                        type="submit"
                                        aria-label={t('search.title')}
                                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                        <IconSearch size={18} aria-hidden="true"/>
                                    </button>
                                </div>
                            </form>
                            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
                                {searchLoading ? (
                                    <p className="py-3 text-sm text-slate-500">{t('search.searching')}</p>
                                ) : searchFailed ? (
                                    <p role="alert" className="py-3 text-sm text-slate-500">{t('search.failed')}</p>
                                ) : searchSubmitted && searchResults && searchResults.catalogues.total === 0 && searchResults.works.total === 0 ? (
                                    <p className="py-3 text-sm text-slate-500">{t('search.noResults')}</p>
                                ) : searchSubmitted && searchResults ? (
                                    <>
                                        <p className="mb-3 text-xs font-medium text-slate-500">{t('search.resultsFor', {query: searchQuery})}</p>
                                        <div className="space-y-6">
                                            {searchResults.catalogues.total > 0 && (
                                                <section>
                                                    <h2 className="mb-2 text-sm font-semibold text-slate-900">{t('search.catalogue')}</h2>
                                                    <ul className="space-y-2">
                                                        {searchResults.catalogues.results.map(result => (
                                                            <li key={result.catalogue}>
                                                                <button type="button" onClick={() => openCatalogue(result.catalogue)} className="w-full rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-300 hover:bg-slate-50">
                                                                    <span className="block text-sm font-semibold text-slate-900">{result.catalogueName || result.catalogue}</span>
                                                                    <span className="mt-0.5 block text-xs text-slate-600">{result.composerName}</span>
                                                                    {result.workCount > 0 && <span className="mt-1 block text-xs text-slate-500">{t('works.count', {count: result.workCount})}</span>}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <button type="button" onClick={() => viewAllResults('catalogues')} className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                                                        {t('search.viewAll', {count: searchResults.catalogues.total})}
                                                    </button>
                                                </section>
                                            )}
                                            {searchResults.works.total > 0 && (
                                                <section>
                                                    <h2 className="mb-2 text-sm font-semibold text-slate-900">{t('navigation.works')}</h2>
                                                    <ul className="space-y-2">
                                                        {searchResults.works.results.map(result => (
                                                            <li key={`${result.catalogueCode}-${result.workId}`}>
                                                                <WorkDetailsDialog
                                                                    work={result}
                                                                    catalogCode={result.catalogueCode}
                                                                    triggerClassName="w-full rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-300 hover:bg-slate-50"
                                                                >
                                                                    <span className="block text-sm font-semibold text-slate-900">{result.title || result.catalogue || result.sort || result.opus}</span>
                                                                    <span className="mt-0.5 block text-xs text-slate-600">{[result.catalogueCode, result.composerName].filter(Boolean).join(' · ')}</span>
                                                                </WorkDetailsDialog>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <button type="button" onClick={() => viewAllResults('works')} className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                                                        {t('search.viewAll', {count: searchResults.works.total})}
                                                    </button>
                                                </section>
                                            )}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </Dialog.Popup>
                    </Dialog.Portal>
                </Dialog.Root>
            </div>
        </header>
        {children}
    </div>
}
