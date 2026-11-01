import {getGenreCsvEntries} from '@/lib/data/csv-loader'
import {getI18n} from '@/lib/i18n/server'
import {isLocale} from '@/lib/i18n/config'
import {notFound} from 'next/navigation'

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
                                <h2 className="heading mb-3 text-lg font-semibold text-slate-900">{cat || 'Other'}</h2>
                                <div className="space-y-4">
                                    {Object.entries(sub).map(([type, subItems]) => (
                                        <div key={type}>
                                            {type && type !== 'Other' ? <h3 className="mb-2 text-sm font-semibold text-slate-700">{type}</h3> : null}
                                            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                {subItems.map(entry => (
                                                    <li key={entry.wikiQID || entry.name}>
                                                        <span className="heading text-base font-semibold text-slate-900">{entry.name}</span>
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
    )
}
