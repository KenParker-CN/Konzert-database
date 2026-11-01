import AppShell from '@/components/AppShell'
import {getGenreCsvEntries} from '@/lib/data/csv-loader'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {IconArrowUpRight} from '@tabler/icons-react'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function GenreCategoryPage({params}: {params: Promise<{locale: string; category: string}>}) {
    const {locale, category} = await params
    if (!isLocale(locale)) notFound()

    const [{t}, entries] = await Promise.all([
        getI18n(locale),
        getGenreCsvEntries(),
    ])

    const decoded = decodeURIComponent(category)
    const items = entries.filter(e => (e.inCategory || 'Other') === decoded)

    if (items.length === 0) notFound()

    const sub = items.reduce<Record<string, typeof items>>((acc, e) => {
        (acc[e.typeOf || 'Other'] ??= []).push(e)
        return acc
    }, {})

    return (
        <AppShell active="genres">
            <main className="min-h-full">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <header className="mb-8">
                        <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">{decoded}</h1>
                    </header>
                    <div className="space-y-8">
                        {Object.entries(sub).map(([type, subItems]) => (
                            <section key={type}>
                                {type && type !== 'Other' ? (
                                    <Link
                                        href={localePath(locale, `/genres/category/${encodeURIComponent(decoded)}/${encodeURIComponent(type)}`)}
                                        className="group mb-3 inline-flex items-center gap-2"
                                    >
                                        <h2 className="heading text-lg font-semibold text-slate-900">{type}</h2>
                                        <IconArrowUpRight size={16} className="text-slate-400 transition group-hover:text-blue-600" aria-hidden="true"/>
                                    </Link>
                                ) : null}
                                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {subItems.map(entry => (
                                        <li key={entry.wikiQID || entry.name}>
                                            <div className="flex min-h-20 items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 shadow-sm">
                                                <span className="heading text-base font-semibold text-slate-900">{entry.name}</span>
                                            </div>
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
