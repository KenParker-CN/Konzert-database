import AppShell from '@/components/AppShell'
import {getGenreCsvEntries} from '@/lib/data/csv-loader'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {IconArrowUpRight} from '@tabler/icons-react'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function GenresPage({params}: {params: Promise<{locale: string}>}) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()

    const [{t}, entries] = await Promise.all([
        getI18n(locale),
        getGenreCsvEntries(),
    ])

    const grouped = entries.reduce<Record<string, typeof entries>>((acc, e) => {
        (acc[e.inCategory || 'Other'] ??= []).push(e)
        return acc
    }, {})

    const categories = Object.entries(grouped)

    return (
        <AppShell active="genres">
            <main className="min-h-full">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <header className="mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{t('navigation.genres')}</p>
                        <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">{t('genrePages.title')}</h1>
                    </header>
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.map(([cat, items]) => (
                            <li key={cat}>
                                <Link
                                    href={localePath(locale, `/genres/category/${encodeURIComponent(cat || 'Other')}`)}
                                    className="group flex min-h-20 items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                >
                                    <span className="min-w-0">
                                        <span className="heading block text-lg font-semibold text-slate-900">{cat || 'Other'}</span>
                                    </span>
                                    <IconArrowUpRight size={18} className="shrink-0 text-slate-400 transition group-hover:text-blue-600" aria-hidden="true"/>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
        </AppShell>
    )
}
