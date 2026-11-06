import type {Metadata} from 'next'
import AppShell from '@/components/AppShell'
import {getInstrumentDirectory, type InstrumentDirectoryEntry} from '@/lib/db/instruments'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {IconArrowUpRight} from '@tabler/icons-react'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
    const {locale} = await params
    if (!isLocale(locale)) notFound()
    const {t} = await getI18n(locale)
    return {title: `${t('instruments.title')} · Konzert`, alternates: {canonical: `/${locale}/instruments`}}
}

function groupByCategory(directory: InstrumentDirectoryEntry[]) {
    const groups = new Map<string, InstrumentDirectoryEntry[]>()
    for (const entry of directory) {
        groups.set(entry.category, [...(groups.get(entry.category) ?? []), entry])
    }
    return [...groups.entries()].sort(([left], [right]) => Number(left === '') - Number(right === ''))
}

export default async function InstrumentsPage({params}: {params: Promise<{locale: string}>}) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()

    const [{t}, directory] = await Promise.all([
        getI18n(locale),
        getInstrumentDirectory(locale),
    ])
    const instrumentCount = directory.reduce((sum, entry) => sum + (entry.kind === 'family' ? entry.instrumentCount : 1), 0)

    return (
        <AppShell active="instruments">
            <main className="min-h-full">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <header className="mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{t('navigation.instruments')}</p>
                        <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">{t('instruments.title')}</h1>
                        <p className="mt-2 text-sm font-medium text-slate-600">{t('instruments.count', {count: instrumentCount})}</p>
                    </header>
                    {groupByCategory(directory).map(([category, entries]) => (
                        <section key={category || 'uncategorized'} className="mb-10 last:mb-0">
                            {category && <h2 className="heading mb-4 text-xl font-semibold tracking-tight text-slate-800">{category}</h2>}
                            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {entries.map(entry => entry.kind === 'family' ? (
                                    <li key={`family-${entry.key}`}>
                                        <Link
                                            href={localePath(locale, `/instruments/family/${encodeURIComponent(entry.key)}`)}
                                            className="group flex min-h-20 items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                        >
                                            <span className="min-w-0">
                                                <span className="heading block text-lg font-semibold text-slate-900">{entry.label}</span>
                                                <span className="mt-1 block text-xs text-slate-500">{t('instruments.count', {count: entry.instrumentCount})}</span>
                                            </span>
                                            <IconArrowUpRight size={18} className="shrink-0 text-slate-400 transition group-hover:text-blue-600" aria-hidden="true"/>
                                        </Link>
                                    </li>
                                ) : (
                                    <li key={`instrument-${entry.abbrev}`}>
                                        <Link
                                            href={localePath(locale, `/instruments/${encodeURIComponent(entry.abbrev)}`)}
                                            className="group flex min-h-20 items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                        >
                                            <span className="min-w-0">
                                                <span className="heading block text-lg font-semibold text-slate-900">{entry.label}</span>
                                                <span className="mt-1 block text-xs text-slate-500">{t('works.count', {count: entry.count})}</span>
                                            </span>
                                            <IconArrowUpRight size={18} className="shrink-0 text-slate-400 transition group-hover:text-blue-600" aria-hidden="true"/>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            </main>
        </AppShell>
    )
}
