import AppShell from '@/components/AppShell'
import {searchArchive} from '@/lib/db/search'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {notFound} from 'next/navigation'
import {IconSearch} from '@tabler/icons-react'
import Link from 'next/link'
import WorkDetailsDialog from '@/components/catalogues/WorkDetailsDialog'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export default async function SearchPage({params, searchParams}: {
    params: Promise<{locale: string}>
    searchParams: Promise<{q?: string; type?: string; page?: string}>
}) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()

    const {q, type: requestedType, page: requestedPage} = await searchParams
    const {t} = await getI18n(locale)
    const query = typeof q === 'string' ? q.trim() : ''
    const type = requestedType === 'works' ? 'works' : 'catalogues'
    const page = Math.max(1, Number.parseInt(requestedPage ?? '1', 10) || 1)
    const offset = (page - 1) * PAGE_SIZE
    const results = await searchArchive(query, type === 'works'
        ? {catalogueLimit: 0, workOffset: offset, workLimit: PAGE_SIZE}
        : {catalogueOffset: offset, catalogueLimit: PAGE_SIZE, workLimit: 0})
    const total = results[type].total
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const visibleResults = results[type].results
    const typeLabel = type === 'works' ? t('navigation.works') : t('search.catalogue')
    const pageHref = (nextPage: number) => localePath(locale, `/search?q=${encodeURIComponent(query)}&type=${type}&page=${nextPage}`)

    return (
        <AppShell>
            <main className="min-h-full">
                <div className="mx-auto max-w-360 px-5 py-8 lg:px-8 lg:py-10">
                    <div className="mb-6 flex items-center gap-2">
                        <IconSearch size={18} className="text-slate-400" aria-hidden="true"/>
                        <h1 className="heading text-xl font-semibold tracking-tight text-slate-950">
                            {query ? t('search.resultsFor', {query}) : t('search.title')}
                        </h1>
                    </div>

                    {query && (
                        <nav className="mb-5 flex flex-wrap gap-2" aria-label={t('search.title')}>
                            {([
                                ['catalogues', t('search.catalogue'), results.catalogues.total],
                                ['works', t('navigation.works'), results.works.total],
                            ] as const).map(([resultType, label, count]) => (
                                <Link
                                    key={resultType}
                                    href={localePath(locale, `/search?q=${encodeURIComponent(query)}&type=${resultType}`)}
                                    aria-current={type === resultType ? 'page' : undefined}
                                    className={`rounded-md border px-3 py-2 text-sm ${type === resultType ? 'border-blue-200 bg-blue-50 font-semibold text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {label} ({count})
                                </Link>
                            ))}
                        </nav>
                    )}

                    <section>
                        <h2 className="mb-3 text-sm font-semibold text-slate-600">{typeLabel} · {total}</h2>
                        {visibleResults.length === 0 ? (
                            <p className="text-sm text-slate-500">{t('search.noResults')}</p>
                        ) : type === 'catalogues' ? (
                            <ul className="space-y-2">
                                {results.catalogues.results.map(entry => (
                                    <li key={entry.catalogue}>
                                        <Link href={localePath(locale, `/catalogues/${entry.catalogue}`)} className="block rounded-md border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-300 hover:shadow-md">
                                            <p className="text-sm font-semibold text-slate-900">{entry.catalogueName || entry.catalogue}</p>
                                            <p className="mt-0.5 text-xs text-slate-600">{entry.composerName}</p>
                                            {entry.workCount > 0 && <span className="text-xs text-slate-500">{t('works.count', {count: entry.workCount})}</span>}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <ul className="space-y-2">
                                {results.works.results.map(work => (
                                    <li key={`${work.catalogueCode}-${work.workId}`}>
                                        <WorkDetailsDialog work={work} catalogCode={work.catalogueCode} triggerClassName="block w-full rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md">
                                            <span className="block text-sm font-semibold text-slate-900">{work.title || work.catalogue || work.sort || work.opus}</span>
                                            <span className="mt-0.5 block text-xs text-slate-600">{[work.catalogueCode, work.composerName].filter(Boolean).join(' · ')}</span>
                                        </WorkDetailsDialog>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {total > PAGE_SIZE && (
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                            <p className="text-sm text-slate-500">{t('works.pageInfo', {current: page, total: pageCount})}</p>
                            <div className="flex gap-2">
                                <Link aria-disabled={page <= 1} className={`rounded-md border border-slate-200 px-3 py-2 text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-slate-50'}`} href={pageHref(Math.max(1, page - 1))}>{t('common.previous')}</Link>
                                <Link aria-disabled={page >= pageCount} className={`rounded-md border border-slate-200 px-3 py-2 text-sm ${page >= pageCount ? 'pointer-events-none opacity-50' : 'hover:bg-slate-50'}`} href={pageHref(Math.min(pageCount, page + 1))}>{t('common.next')}</Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </AppShell>
    )
}
