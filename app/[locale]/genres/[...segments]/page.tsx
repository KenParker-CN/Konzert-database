import type {Metadata} from 'next'
import AppShell from '@/components/AppShell'
import InstrumentBreadcrumb from '@/components/instruments/InstrumentBreadcrumb'
import GenreCard from '@/components/genres/GenreCard'
import GenreIntroduction from '@/components/genres/GenreIntroduction'
import GenreRelatedWorks from '@/components/genres/GenreRelatedWorks'
import {getGenreCsvEntries} from '@/lib/data/csv-loader'
import {getGenreWorksSafe} from '@/lib/db/composers'
import {getGenreAncestors, getGenreChildren, getGenrePath} from '@/lib/data/genre-v2'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

type GenreParams = {locale: string; segments: string[]}

function findGenre(entries: Awaited<ReturnType<typeof getGenreCsvEntries>>, segments: string[]) {
    const key = segments.join('/')
    return entries.find(candidate => candidate.segments.join('/') === key)
}

export async function generateMetadata({params}: {params: Promise<GenreParams>}): Promise<Metadata> {
    const {locale, segments} = await params
    if (!isLocale(locale)) notFound()
    const entry = findGenre(await getGenreCsvEntries(), segments)
    return {
        title: entry ? `${getLocalizedWorkTerm(entry.name, 'type', locale)} · Konzert` : undefined,
        alternates: {canonical: entry ? localePath(locale, getGenrePath(entry)) : undefined},
    }
}

export default async function GenreDetailPage({params}: {params: Promise<GenreParams>}) {
    const {locale, segments} = await params
    if (!isLocale(locale)) notFound()

    const entries = await getGenreCsvEntries()
    const entry = findGenre(entries, segments)
    if (!entry) notFound()

    const [{t}, {groups: relatedWorkGroups}] = await Promise.all([
        getI18n(locale),
        getGenreWorksSafe([entry.name], locale),
    ])
    const title = getLocalizedWorkTerm(entry.name, 'type', locale)
    const ancestors = getGenreAncestors(entries, entry)
    const children = getGenreChildren(entries, entry)

    return (
        <AppShell active="genres">
            <main className="min-h-[calc(100dvh-4rem)]">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <InstrumentBreadcrumb items={[
                        {label: t('navigation.genres'), href: localePath(locale, '/genres')},
                        ...ancestors.map(ancestor => ({
                            label: getLocalizedWorkTerm(ancestor.name, 'type', locale),
                            href: localePath(locale, getGenrePath(ancestor)),
                        })),
                        {label: title},
                    ]}/>
                    <article className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h1 className="heading text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
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
