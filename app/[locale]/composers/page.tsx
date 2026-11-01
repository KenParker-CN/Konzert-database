import AppShell from '@/components/AppShell'
import LetterScrollIndicator from '@/components/catalogues/LetterScrollIndicator'
import {getCatalogueDirectory} from '@/lib/db/composers'
import {getLocalizedComposerName} from '@/lib/composer-name'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath, type Locale} from '@/lib/i18n/config'
import type {Translator} from '@/lib/i18n/core'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

type ComposerEntry = Awaited<ReturnType<typeof getCatalogueDirectory>>[number]

function sortName(entry: ComposerEntry) {
    return entry.composerNameSort || entry.composerName
}

function letterOf(value: string) {
    const first = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().charAt(0).toLocaleUpperCase('en')
    return /[A-Z]/.test(first) ? first : '#'
}

function renderComposerCard(entry: ComposerEntry, locale: Locale, t: Translator) {
    const displayName = entry.composerNameSort || getLocalizedComposerName(entry.composerName, entry.composerAliases, locale)
    return (
        <Link
            key={entry.catalogue}
            href={localePath(locale, `/composers/${encodeURIComponent(entry.composerSlug)}`)}
            className="group flex min-h-20 flex-col justify-between gap-2 border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
            <span className="heading text-base font-semibold text-slate-900">{displayName}</span>
            {entry.era && <span className="text-sm text-slate-600">{entry.era}</span>}
            <span className="text-xs text-slate-500">{t('works.count', {count: entry.workCount})}</span>
        </Link>
    )
}

export default async function ComposersPage({params}: {params: Promise<{locale: string}>}) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()

    const [{t}, directory] = await Promise.all([
        getI18n(locale),
        getCatalogueDirectory().catch(() => []),
    ])

    const groups = new Map<string, ComposerEntry[]>()
    const sorted = [...directory].sort((left, right) =>
        sortName(left).localeCompare(sortName(right), 'en', {sensitivity: 'base'}))
    for (const entry of sorted) {
        const letter = letterOf(sortName(entry))
        groups.set(letter, [...(groups.get(letter) ?? []), entry])
    }
    const letters = [...groups.keys()].sort((left, right) => {
        if (left === '#') return 1
        if (right === '#') return -1
        return left.localeCompare(right)
    })

    return (
        <AppShell active="composers">
            <main>
                <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
                    <header className="mb-8">
                        <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                            {t('composerIndex.title')}
                        </h1>
                        <p className="mt-3 text-sm font-medium text-slate-600">
                            {t('composerIndex.count', {count: directory.length})}
                        </p>
                    </header>
                    <LetterScrollIndicator letters={letters} label={t('composerIndex.title')}/>
                    <div className="space-y-10">
                        {letters.map(letter => (
                            <section key={letter} id={`letter-${letter}`}>
                                <h2 className="heading mb-4 border-b border-slate-200 pb-2 text-xl font-semibold text-slate-950">{letter}</h2>
                                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {(groups.get(letter) ?? []).map(entry => renderComposerCard(entry, locale, t))}
                                </ul>
                            </section>
                        ))}
                    </div>
                </div>
            </main>
        </AppShell>
    )
}
