import type {Metadata} from 'next'
import AppShell from '@/components/AppShell'
import GenreCard from '@/components/genres/GenreCard'
import {getGenreCsvEntries} from '@/lib/data/csv-loader'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
    const {locale} = await params
    if (!isLocale(locale)) notFound()
    const {t} = await getI18n(locale)
    return {title: `${t('genrePages.title')} · Konzert`, alternates: {canonical: `/${locale}/genres`}}
}

export default async function GenresPage({params, searchParams}: {
    params: Promise<{locale: string}>
    searchParams: Promise<{medium?: string}>
}) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()
    const {medium: requestedMedium} = await searchParams
    const {t} = await getI18n(locale)

    const entries = await getGenreCsvEntries()
    const groups = new Map<string, typeof entries>()
    for (const entry of entries.filter(entry => !entry.typeOf)) {
        groups.set(entry.medium, [...(groups.get(entry.medium) ?? []), entry])
    }
    const sortedGroups = [...groups.entries()].sort(([left], [right]) => Number(left === '') - Number(right === ''))
    const active = sortedGroups.find(([medium]) => medium === requestedMedium) ?? sortedGroups[0]
    const basePath = localePath(locale, '/genres')

    return (
        <AppShell active="genres">
            <main className="min-h-full">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <header className="mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{t('navigation.genres')}</p>
                        <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">{t('genrePages.title')}</h1>
                    </header>
                    {sortedGroups.length > 0 && (
                        <nav aria-label={t('genrePages.title')} className="mb-8 flex flex-wrap gap-2 border-b border-slate-200">
                            {sortedGroups.map(([medium]) => {
                                const isActive = active?.[0] === medium
                                return (
                                    <Link
                                        key={medium || 'other'}
                                        href={`${basePath}?medium=${encodeURIComponent(medium)}`}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
                                    >
                                        {medium || t('instruments.otherCategory')}
                                    </Link>
                                )
                            })}
                        </nav>
                    )}
                    {active && (
                        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {active[1].map(entry => (
                                <li key={entry.wikiQID || entry.name}>
                                    <GenreCard locale={locale} entry={entry}/>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </AppShell>
    )
}
