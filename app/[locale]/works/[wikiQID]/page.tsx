import type {Metadata} from 'next'
import AppShell from '@/components/AppShell'
import InstrumentationLegendDialog from '@/components/catalogues/InstrumentationLegendDialog'
import GenreIntroduction from '@/components/genres/GenreIntroduction'
import {getWorksByWikiID} from '@/lib/db/composers'
import {getI18n} from '@/lib/i18n/server'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import {isLocale, localePath} from '@/lib/i18n/config'
import {
    formatWorkDetailValue,
    getWorkDetailFields,
    getWorkDetailLabelKey,
    isFullWidthWorkDetail,
} from '@/lib/works/work-detail-fields'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({params}: {params: Promise<{locale: string; wikiQID: string}>}): Promise<Metadata> {
    const {locale, wikiQID} = await params
    if (!isLocale(locale)) notFound()
    const [first] = await getWorksByWikiID(wikiQID.toUpperCase())
    const title = first ? (locale === 'de' ? first.work.details['German title'] || first.work.title : first.work.title) : undefined
    return {title: title ? `${title} · Konzert` : undefined, alternates: {canonical: `/${locale}/works/${wikiQID}`}}
}

export default async function WorkDetailPage({params}: {params: Promise<{locale: string; wikiQID: string}>}) {
    const {locale, wikiQID} = await params
    if (!isLocale(locale)) notFound()

    const wikiID = wikiQID.toUpperCase()
    if (!/^Q\d+$/.test(wikiID)) notFound()

    const matches = await getWorksByWikiID(wikiID)
    if (matches.length === 0) notFound()

    const {t} = await getI18n(locale)
    const titleOf = (work: (typeof matches)[number]['work']) => locale === 'de'
        ? work.details['German title'] || work.title
        : work.title
    const [first] = matches

    return (
        <AppShell active="catalogues">
            <main className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8 lg:px-8 lg:py-10">
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h1 className="heading text-3xl font-semibold tracking-tight text-slate-950">
                        {titleOf(first.work) || first.work.catalogue || first.work.opus}
                    </h1>
                    {first.work.details['Subtitle'] && (
                        <p className="mt-1 text-base italic text-slate-500">{first.work.details['Subtitle']}</p>
                    )}
                    <GenreIntroduction wikiID={wikiID} locale={locale}/>
                </article>

                {matches.map(({entry, work}) => {
                    const composerName = entry.composerAliases[locale] || entry.composerName
                    const fields = getWorkDetailFields(work.details, entry.catalogue, locale)
                    return (
                        <section key={`${entry.catalogue}-${work.workId}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <Link href={localePath(locale, `/catalogues/${encodeURIComponent(entry.catalogue)}`)} className="text-sm font-medium text-blue-700 hover:underline">
                                    {composerName} · {entry.catalogueName || entry.catalogue}
                                </Link>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                                {[work.catalogue, work.secondaryCatalogue].filter(Boolean).join(' · ') || work.opus || work.date}
                            </p>
                            {(work.genre || work.key) && (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {work.genre && (
                                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                            {getLocalizedWorkTerm(work.genre, 'type', locale)}
                                        </span>
                                    )}
                                    {work.key && (
                                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                            {getLocalizedWorkTerm(work.key, 'key', locale)}
                                        </span>
                                    )}
                                </div>
                            )}
                            <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                                {fields.map(([field, value]) => {
                                    const labelKey = getWorkDetailLabelKey(field)
                                    const isInstrumentation = ['instrumentation', 'instrmentation'].includes(field.toLocaleLowerCase())
                                    return (
                                        <div key={field} className={`min-w-0 ${isFullWidthWorkDetail(field) ? 'sm:col-span-2' : ''}`}>
                                            <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                                                {labelKey ? t(labelKey) : field}
                                                {isInstrumentation && (
                                                    <InstrumentationLegendDialog triggerClassName="inline-flex shrink-0 items-center justify-center text-blue-400 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"/>
                                                )}
                                            </dt>
                                            <dd className="mt-1 min-w-0 text-sm text-slate-900">
                                                <span className="whitespace-pre-wrap wrap-break-word">
                                                    {formatWorkDetailValue(field, value, locale)}
                                                </span>
                                            </dd>
                                        </div>
                                    )
                                })}
                            </dl>
                        </section>
                    )
                })}
            </main>
        </AppShell>
    )
}
