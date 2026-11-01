import AppShell from '@/components/AppShell'
import InstrumentBreadcrumb from '@/components/instruments/InstrumentBreadcrumb'
import GenreIntroduction from '@/components/genres/GenreIntroduction'
import {getGenreCsvEntries} from '@/lib/data/csv-loader'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function GenreNamePage({params}: {params: Promise<{locale: string; category: string; type: string; name: string}>}) {
    const {locale, category, type, name} = await params
    if (!isLocale(locale)) notFound()

    const entries = await getGenreCsvEntries()
    const decodedCategory = decodeURIComponent(category)
    const decodedType = decodeURIComponent(type)
    const decodedName = decodeURIComponent(name)
    const entry = entries.find(e => e.name === decodedName)

    if (!entry) notFound()

    const {t} = await getI18n(locale)

    return (
        <AppShell active="genres">
            <main className="min-h-[calc(100dvh-4rem)]">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <InstrumentBreadcrumb items={[
                        {label: t('navigation.catalogues'), href: localePath(locale, '/catalogues')},
                        {label: decodedCategory, href: localePath(locale, `/genres/category/${encodeURIComponent(decodedCategory)}`)},
                        {label: decodedType, href: localePath(locale, `/genres/category/${encodeURIComponent(decodedCategory)}/${encodeURIComponent(decodedType)}`)},
                        {label: entry.name},
                    ]}/>
                    <header className="mb-8">
                        <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">{entry.name}</h1>
                        <p className="mt-2 text-sm font-medium text-slate-600">{entry.inCategory}{entry.typeOf ? ` / ${entry.typeOf}` : ''}</p>
                    </header>
                    <GenreIntroduction wikiID={entry.wikiQID} locale={locale}/>
                </div>
            </main>
        </AppShell>
    )
}
