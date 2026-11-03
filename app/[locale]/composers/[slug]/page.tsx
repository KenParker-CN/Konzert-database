import AppShell from '@/components/AppShell'
import CatalogueCitation from '@/components/catalogues/CatalogueCitation'
import GenreIntroduction from '@/components/genres/GenreIntroduction'
import {getComposer} from '@/lib/db/composers'
import {getCatalogForComposer} from '@/lib/data/composer-catalog-map'
import {getLocalizedComposerName} from '@/lib/composer-name'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ComposerDetailPage({params}: {params: Promise<{locale: string; slug: string}>}) {
    const {locale, slug} = await params
    if (!isLocale(locale)) notFound()

    const composer = await getComposer(slug)
    if (!composer) notFound()

    const {t} = await getI18n(locale)
    const catalogCode = getCatalogForComposer(slug)
    const displayName = getLocalizedComposerName(composer.name, composer.aliases, locale)
    const lifespan = [composer.startDate, composer.endDate].filter(Boolean).join(' – ')
    const meta = [composer.era, lifespan].filter(Boolean).join(' · ')

    return (
        <AppShell active="composers">
            <main>
                <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8 lg:py-10">
                    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h1 className="heading text-3xl font-semibold tracking-tight text-slate-950">{displayName}</h1>
                        {meta && <p className="mt-2 text-sm text-slate-500">{meta}</p>}
                        <GenreIntroduction wikiID={composer.wikiQID} locale={locale}/>
                        {composer.catalogRef && (
                            <CatalogueCitation
                                title={composer.catalogRef}
                                author={composer.catalogAuthor}
                                publisher={composer.catalogPublisher}
                                year={composer.catalogYear}
                                className="mt-6 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-600"
                            />
                        )}
                        {catalogCode && (
                            <Link href={localePath(locale, `/catalogues/${encodeURIComponent(catalogCode)}`)} className="mt-6 inline-block text-sm font-medium text-blue-700 hover:underline">
                                {t('search.catalogue')}
                            </Link>
                        )}
                    </article>
                </div>
            </main>
        </AppShell>
    )
}
