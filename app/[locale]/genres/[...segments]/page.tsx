import type {Metadata} from 'next'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import InstrumentBreadcrumb from '@/components/instruments/InstrumentBreadcrumb'
import GenreCard from '@/components/genres/GenreCard'
import GenreIntroduction from '@/components/genres/GenreIntroduction'
import GenreRelatedWorks from '@/components/genres/GenreRelatedWorks'
import {getGenreCsvEntries, type GenreCsvEntry} from '@/lib/data/csv-loader'
import {getGenreWorksSafe} from '@/lib/db/composers'
import {getInstrumentRefsByName, type InstrumentRef} from '@/lib/db/instruments'
import {getGenreAncestors, getGenreChildren, getGenrePath, stripDiacritics} from '@/lib/data/genre-v2'
import {localizeGenreTerm} from '@/lib/i18n/genre-term'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {notFound, permanentRedirect} from 'next/navigation'

export const dynamic = 'force-dynamic'

const INSTRUMENTS_SEGMENT = 'instruments'

type GenreParams = {locale: string; segments: string[]}

function findGenre(entries: GenreCsvEntry[], segments: string[]) {
    const key = segments.join('/')
    return entries.find(candidate => candidate.segments.join('/') === key)
}

function decodeSegment(segment: string) {
    try {
        return decodeURIComponent(segment)
    } catch {
        return segment
    }
}

function normalizeSegments(segments: string[]) {
    return segments.map(segment => stripDiacritics(decodeSegment(segment)))
}

function resolveGenreRoute(entries: GenreCsvEntry[], segments: string[]) {
    const instrumentsView = segments.at(-1) === INSTRUMENTS_SEGMENT
    const normalized = normalizeSegments(segments)
    const entry = findGenre(entries, instrumentsView ? normalized.slice(0, -1) : normalized)
    return {entry, instrumentsView}
}

function instrumentPath(ref: InstrumentRef) {
    return ref.familyKey
        ? `/instruments/family/${encodeURIComponent(ref.familyKey)}/${encodeURIComponent(ref.abbrev)}`
        : `/instruments/${encodeURIComponent(ref.abbrev)}`
}

export async function generateMetadata({params}: {params: Promise<GenreParams>}): Promise<Metadata> {
    const {locale, segments} = await params
    if (!isLocale(locale)) notFound()
    const {entry, instrumentsView} = resolveGenreRoute(await getGenreCsvEntries(), segments)
    const canonicalPath = entry && (instrumentsView ? `${getGenrePath(entry)}/${INSTRUMENTS_SEGMENT}` : getGenrePath(entry))
    return {
        title: entry ? `${localizeGenreTerm(entry.name, locale, entry.nameZh)} · Konzert` : undefined,
        alternates: {canonical: canonicalPath ? localePath(locale, canonicalPath) : undefined},
    }
}

export default async function GenreDetailPage({params}: {params: Promise<GenreParams>}) {
    const {locale, segments} = await params
    if (!isLocale(locale)) notFound()

    const entries = await getGenreCsvEntries()
    const {entry, instrumentsView} = resolveGenreRoute(entries, segments)
    if (!entry || (instrumentsView && entry.relatedInstruments.length === 0)) notFound()

    if (segments.join('/') !== normalizeSegments(segments).join('/')) {
        permanentRedirect(localePath(locale, `${getGenrePath(entry)}${instrumentsView ? `/${INSTRUMENTS_SEGMENT}` : ''}`))
    }

    const {t} = await getI18n(locale)
    const title = localizeGenreTerm(entry.name, locale, entry.nameZh)
    const ancestors = getGenreAncestors(entries, entry)
    const ancestorCrumbs = [
        {label: t('navigation.genres'), href: localePath(locale, '/genres')},
        ...ancestors.map(ancestor => ({
            label: localizeGenreTerm(ancestor.name, locale, ancestor.nameZh),
            href: localePath(locale, getGenrePath(ancestor)),
        })),
    ]

    if (instrumentsView) {
        const instruments = await getInstrumentRefsByName(entry.relatedInstruments)
        return (
            <AppShell active="genres">
                <main className="min-h-[calc(100dvh-4rem)]">
                    <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                        <InstrumentBreadcrumb items={[
                            ...ancestorCrumbs,
                            {label: title, href: localePath(locale, getGenrePath(entry))},
                            {label: t('genrePages.relatedInstruments')},
                        ]}/>
                        <section className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{t('genrePages.relatedInstruments')}</p>
                            <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
                            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {instruments.map(ref => (
                                    <li key={ref.abbrev}>
                                        <Link
                                            href={localePath(locale, instrumentPath(ref))}
                                            className="group flex min-h-20 items-center border border-slate-200 bg-white px-5 py-4 font-medium text-slate-950 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                        >
                                            {ref.name[locale]}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>
                </main>
            </AppShell>
        )
    }

    const {groups: relatedWorkGroups} = await getGenreWorksSafe([entry.name], locale)
    const children = getGenreChildren(entries, entry)
    const relatedInstruments = entry.relatedInstruments.length > 0
        ? await getInstrumentRefsByName(entry.relatedInstruments)
        : []

    return (
        <AppShell active="genres">
            <main className="min-h-[calc(100dvh-4rem)]">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <InstrumentBreadcrumb items={[...ancestorCrumbs, {label: title}]}/>
                    <article className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h1 className="heading text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
                        {relatedInstruments.length > 0 && (
                            <p className="mt-2 flex flex-wrap items-baseline gap-x-3 text-sm font-medium text-slate-600">
                                <span>{t('genrePages.relatedInstrumentsLabel')}</span>
                                {relatedInstruments.map(ref => (
                                    <Link
                                        key={ref.abbrev}
                                        href={localePath(locale, instrumentPath(ref))}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {ref.name[locale]}
                                    </Link>
                                ))}
                            </p>
                        )}
                        <GenreIntroduction wikiID={entry.wikiQID || undefined} locale={locale}/>
                    </article>
                    {children.length > 0 ? (
                        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {children.map(child => (
                                <li key={child.wikiQID || child.name}>
                                    <GenreCard locale={locale} entry={child}/>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                    <GenreRelatedWorks groups={relatedWorkGroups}/>
                </div>
            </main>
        </AppShell>
    )
}
