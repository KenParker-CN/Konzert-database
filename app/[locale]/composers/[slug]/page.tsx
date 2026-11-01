import AppShell from '@/components/AppShell'
import GenreIntroduction from '@/components/genres/GenreIntroduction'
import {getComposer} from '@/lib/db/composers'
import {getCatalogForComposer} from '@/lib/data/composer-catalog-map'
import {getLocalizedComposerName, getCountryFlagCode} from '@/lib/composer-name'
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
    const displayName = getLocalizedComposerName(composer.name, composer.aliases, locale)
    const lifespan = [composer.startDate, composer.endDate].filter(Boolean).join('–') || null
    const catalogCode = getCatalogForComposer(slug)

    return (
        <AppShell active="composers">
            <main>
                <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8 lg:py-10">
                    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h1 className="heading text-3xl font-semibold tracking-tight text-slate-950">{displayName}</h1>
                        {(composer.nationalities.length > 0 || lifespan) && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                {composer.nationalities.map(code => {
                                    const flagCode = getCountryFlagCode(code)
                                    return flagCode ? (
                                        <span key={code} className={`fi fi-${flagCode}`} role="img" aria-label={`Nationality: ${code}`} title={code}></span>
                                    ) : null
                                })}
                                {lifespan && <span>{lifespan}</span>}
                            </div>
                        )}
                        {composer.wikiQID && (
                            <div className="mt-5 border-t border-slate-100 pt-5">
                                <GenreIntroduction wikiID={composer.wikiQID} locale={locale}/>
                            </div>
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
