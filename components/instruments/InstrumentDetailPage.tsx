import type {Metadata} from 'next'
import AppShell from '@/components/AppShell'
import InstrumentBreadcrumb from '@/components/instruments/InstrumentBreadcrumb'
import GenreIntroduction from '@/components/genres/GenreIntroduction'
import GenreRelatedWorks from '@/components/genres/GenreRelatedWorks'
import {getGenreCsvEntries} from '@/lib/data/csv-loader'
import {getGenrePath} from '@/lib/data/genre-v2'
import {getInstrumentRef, getInstrumentRelatedWorkGroups} from '@/lib/db/instruments'
import {localizeGenreTerm} from '@/lib/i18n/genre-term'
import {getI18n} from '@/lib/i18n/server'
import {localePath, type Locale} from '@/lib/i18n/config'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export async function generateInstrumentMetadata(locale: Locale, code: string, canonicalPath: string): Promise<Metadata> {
    const ref = await getInstrumentRef(code)
    return {title: ref ? `${ref.name[locale]} · Konzert` : undefined, alternates: {canonical: canonicalPath}}
}

export default async function InstrumentDetailPage({locale, code, familyKey}: {
    locale: Locale
    code: string
    familyKey?: string
}) {
    const ref = await getInstrumentRef(code)
    if (!ref) notFound()
    if (familyKey !== undefined && ref.familyKey !== familyKey) notFound()

    const related = ref.relatedAbbrev ? await getInstrumentRef(ref.relatedAbbrev) : undefined
    const [{t}, relatedWorkGroups, genreEntries] = await Promise.all([
        getI18n(locale),
        getInstrumentRelatedWorkGroups(ref.abbrev, locale),
        getGenreCsvEntries(),
    ])
    const englishName = ref.name.en.toLocaleLowerCase('en')
    const relatedGenres = genreEntries.filter(entry =>
        entry.relatedInstruments.some(name => name.toLocaleLowerCase('en') === englishName),
    )

    const details = [
        [t('instruments.details.category'), ref.details.category],
        [t('instruments.details.type'), ref.details.type],
        [t('instruments.details.mechanism'), ref.details.mechanism],
        [t('instruments.details.relation'), ref.details.relation],
    ].filter(([, value]) => value)

    return (
        <AppShell active="instruments">
            <main className="min-h-[calc(100dvh-4rem)]">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <InstrumentBreadcrumb items={[
                        {label: t('navigation.instruments'), href: localePath(locale, '/instruments')},
                        ...(ref.familyKey && ref.familyName ? [{label: ref.familyName[locale], href: localePath(locale, `/instruments/family/${encodeURIComponent(ref.familyKey)}`)}] : []),
                        {label: ref.name[locale]},
                    ]}/>
                    <article className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h1 className="heading text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{ref.name[locale]}</h1>
                        {ref.slogan[locale] && <p className="mt-2 text-base italic text-slate-600">“{ref.slogan[locale]}”</p>}
                        {related && (
                            <p className="mt-2 text-sm text-slate-600">
                                {t('instruments.seeAlso')}:{' '}
                                <Link href={localePath(locale, `/instruments/${encodeURIComponent(related.abbrev)}`)} className="font-medium text-blue-600 hover:underline">
                                    {related.name[locale]}
                                </Link>
                            </p>
                        )}
                        {details.length > 0 && (
                            <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                                {details.map(([label, value]) => (
                                    <div key={label}>
                                        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
                                        <dd className="mt-1 text-slate-800">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                        <GenreIntroduction wikiID={ref.wikiID} locale={locale}/>
                    </article>
                    {relatedGenres.length > 0 && (
                        <section className="mt-5 border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <h2 className="heading text-xl font-semibold text-slate-950">{t('instruments.relatedGenres')}</h2>
                            <ul className="mt-4 flex flex-wrap gap-2">
                                {relatedGenres.map(entry => (
                                    <li key={entry.segments.join('/')}>
                                        <Link
                                            href={localePath(locale, getGenrePath(entry))}
                                            className="inline-block border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
                                        >
                                            {localizeGenreTerm(entry.name, locale, entry.nameZh)}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    <GenreRelatedWorks groups={relatedWorkGroups} showInstrumentation={false} showGenre/>
                </div>
            </main>
        </AppShell>
    )
}
