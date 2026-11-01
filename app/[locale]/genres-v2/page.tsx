import AppShell from '@/components/AppShell'
import {getGenreCsvEntries} from '@/lib/data/csv-loader'
import {getGenreV2Slug} from '@/lib/data/genre-v2'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {IconArrowUpRight} from '@tabler/icons-react'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function GenresV2Page({params}: {params: Promise<{locale: string}>}) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()
    const {t} = await getI18n(locale)

    const entries = await getGenreCsvEntries()
    const grouped = entries.reduce<Record<string, typeof entries>>((acc, e) => {
        (acc[e.inCategory || 'Other'] ??= []).push(e)
        return acc
    }, {})

    return (
        <AppShell active="genres">
            <main className="min-h-full">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <header className="mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{t('navigation.genres')}</p>
                        <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">{t('genrePages.title')} 2.0</h1>
                    </header>
                    <div className="space-y-8">
                        {Object.entries(grouped).map(([cat, items]) => {
                            const sub = items.reduce<Record<string, typeof items>>((acc, e) => {
                                (acc[e.typeOf || 'Other'] ??= []).push(e)
                                return acc
                            }, {})
                            return (
                                <section key={cat}>
                                    <h2 className="heading mb-3 text-lg font-semibold text-slate-900">{cat}</h2>
                                    <div className="space-y-4">
                                        {Object.entries(sub).map(([type, subItems]) => (
                                            <div key={type}>
                                                {type !== 'Other' ? <h3 className="mb-2 text-sm font-semibold text-slate-700">{type}</h3> : null}
                                                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                    {subItems.map(entry => (
                                                        <li key={entry.wikiQID || entry.name}>
                                                            <Link
                                                                href={localePath(locale, `/genres-v2/${encodeURIComponent(getGenreV2Slug(entry.name))}`)}
                                                                className="group flex min-h-20 items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                                            >
                                                                <span className="heading text-base font-semibold text-slate-900">{getLocalizedWorkTerm(entry.name, 'type', locale)}</span>
                                                                <IconArrowUpRight size={18} className="shrink-0 text-slate-400 transition group-hover:text-blue-600" aria-hidden="true"/>
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )
                        })}
                    </div>
                </div>
            </main>
        </AppShell>
    )
}
