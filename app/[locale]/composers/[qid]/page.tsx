import type {Metadata} from 'next'
import AppShell from '@/components/AppShell'
import AlphabetIndex, {type AlphabetIndexItem} from '@/components/AlphabetIndex'
import GenreIntroduction from '@/components/genres/GenreIntroduction'
import MusicServiceLinks from '@/components/composers/MusicServiceLinks'
import {getComposer, getComposerIndex} from '@/lib/db/composers'
import {getCatalogForComposer} from '@/lib/data/composer-catalog-map'
import {getLocalizedComposerName} from '@/lib/composer-name'
import {nationalityFlag} from '@/lib/nationality-flag'
import {isLocale, localePath} from '@/lib/i18n/config'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({params}: {params: Promise<{locale: string; qid: string}>}): Promise<Metadata> {
    const {locale, qid} = await params
    return {alternates: {canonical: `/${locale}/composers/${qid}`}}
}

export default async function ComposerDetailPage({params}: {params: Promise<{locale: string; qid: string}>}) {
    const {locale, qid} = await params
    if (!isLocale(locale)) notFound()

    const [composer, composerIndex] = await Promise.all([getComposer(qid), getComposerIndex()])
    if (!composer) notFound()

    const indexItems: AlphabetIndexItem[] = composerIndex.map(entry => {
        const name = entry.nameSort || entry.name
        return {key: entry.wikiQID, sortName: name, label: name, href: localePath(locale, `/composers/${encodeURIComponent(entry.wikiQID)}`)}
    })
    const catalogCode = getCatalogForComposer(qid)
    const displayName = getLocalizedComposerName(composer.name, composer.aliases, locale)
    const lifespan = [composer.startDate, composer.endDate].filter(Boolean).join(' – ')
    const flags = composer.nationalities.map(nationalityFlag).filter(Boolean).join(' ')
    const meta = [flags, composer.era, lifespan].filter(Boolean).join(' · ')

    return (
        <AppShell active="composers">
            <main>
                <AlphabetIndex items={indexItems} activeKey={qid}/>
                <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8 lg:py-10">
                    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex items-baseline justify-between gap-4">
                            <h1 className="heading text-3xl font-semibold tracking-tight text-slate-950">{displayName}</h1>
                            {catalogCode && (
                                <Link href={localePath(locale, `/catalogues/${encodeURIComponent(catalogCode)}`)} className="shrink-0 text-sm font-medium text-blue-700 hover:underline">
                                    {composer.catalogueName || catalogCode}
                                </Link>
                            )}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-4">
                            {meta ? <p className="text-sm text-slate-500">{meta}</p> : <span/>}
                            <MusicServiceLinks name={composer.name}/>
                        </div>
                        <GenreIntroduction wikiID={composer.wikiQID} locale={locale}/>
                    </article>
                </div>
            </main>
        </AppShell>
    )
}
