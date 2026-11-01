import AppShell from '@/components/AppShell'
import GenreIntroduction from '@/components/genres/GenreIntroduction'
import InstrumentBreadcrumb from '@/components/instruments/InstrumentBreadcrumb'
import {getGenreCsvEntries} from '@/lib/data/csv-loader'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {IconArrowUpRight} from '@tabler/icons-react'
import Link from 'next/link'
import {notFound, redirect} from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function GenreTypePage({params}: {params: Promise<{locale: string; category: string; type: string}>}) {
    const {locale, category, type} = await params
    if (!isLocale(locale)) notFound()

    const entries = await getGenreCsvEntries()
    const decodedCat = decodeURIComponent(category)
    const decodedType = decodeURIComponent(type)
    const items = entries.filter(e => (e.inCategory || 'Other') === decodedCat && (e.typeOf || 'Other') === decodedType)

    if (items.length === 0) {
        const untyped = entries.find(e => (e.inCategory || 'Other') === decodedCat && !e.typeOf && e.name === decodedType)
        if (untyped) redirect(localePath(locale, `/genres/category/${encodeURIComponent(decodedCat)}/Other/${encodeURIComponent(untyped.name)}`))
        notFound()
    }

    const typeEntry = entries.find(e => (e.inCategory || 'Other') === decodedCat && !e.typeOf && e.name === decodedType)
    const {t} = await getI18n(locale)

    return (
        <AppShell active="genres">
            <main className="min-h-full">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <InstrumentBreadcrumb items={[
                        {label: t('navigation.genres'), href: localePath(locale, '/genres')},
                        {label: decodedCat, href: localePath(locale, `/genres/category/${encodeURIComponent(decodedCat)}`)},
                        {label: decodedType},
                    ]}/>
                    <header className="mb-8">
                        <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">{decodedType}</h1>
                    </header>
                    <GenreIntroduction wikiID={typeEntry?.wikiQID} locale={locale}/>
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map(entry => (
                            <li key={entry.wikiQID || entry.name}>
                                <Link
                                    href={localePath(locale, `/genres/category/${encodeURIComponent(decodedCat)}/${encodeURIComponent(decodedType)}/${encodeURIComponent(entry.name)}`)}
                                    className="group flex min-h-20 items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                >
                                    <span className="heading text-base font-semibold text-slate-900">{entry.name}</span>
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
