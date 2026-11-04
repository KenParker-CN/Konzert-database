import type {Metadata} from 'next'
import AppShell from '@/components/AppShell'
import GenreCard from '@/components/genres/GenreCard'
import {getGenreCsvEntries} from '@/lib/data/csv-loader'
import {getI18n} from '@/lib/i18n/server'
import {isLocale} from '@/lib/i18n/config'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
    const {locale} = await params
    if (!isLocale(locale)) notFound()
    const {t} = await getI18n(locale)
    return {title: `${t('genrePages.title')} · Konzert`, alternates: {canonical: `/${locale}/genres`}}
}

export default async function GenresPage({params}: {params: Promise<{locale: string}>}) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()
    const {t} = await getI18n(locale)

    const entries = await getGenreCsvEntries()
    const grouped = entries
        .filter(entry => !entry.typeOf)
        .reduce<Record<string, typeof entries>>((acc, entry) => {
            (acc[entry.inCategory || 'Other'] ??= []).push(entry)
            return acc
        }, {})

    return (
        <AppShell active="genres">
            <main className="min-h-full">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <header className="mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{t('navigation.genres')}</p>
                        <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">{t('genrePages.title')}</h1>
                    </header>
                    <div className="space-y-8">
                        {Object.entries(grouped).map(([cat, items]) => (
                            <section key={cat}>
                                <h2 className="heading mb-3 text-lg font-semibold text-slate-900">{cat}</h2>
                                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {items.map(entry => (
                                        <li key={entry.wikiQID || entry.name}>
                                            <GenreCard locale={locale} entry={entry}/>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                </div>
            </main>
        </AppShell>
    )
}
