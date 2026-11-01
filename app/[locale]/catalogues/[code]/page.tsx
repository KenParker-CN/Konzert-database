import AppShell from '@/components/AppShell'
import CatalogWorksPanel from '@/components/catalogues/CatalogWorksPanel'
import WorksLoading from '@/components/catalogues/WorksLoading'
import RefreshCatalogueWorksButton from '@/components/catalogues/RefreshCatalogueWorksButton'
import CatalogueWorkspace from '@/components/catalogues/CatalogueWorkspace'
import SpotifyEmbed from '@/components/catalogues/SpotifyEmbed'
import GenreIntroduction from '@/components/genres/GenreIntroduction'
import {getCatalogueDirectory, getComposer} from '@/lib/db/composers'
import {getCatalogForComposer} from '@/lib/data/composer-catalog-map'
import {getI18n} from '@/lib/i18n/server'
import {isLocale} from '@/lib/i18n/config'
import {notFound} from 'next/navigation'
import {KV_API_URL} from '@/lib/data/csv-loader'

import {Suspense} from 'react'
import {getCountryFlagCode, getLocalizedComposerName} from '@/lib/composer-name'

export const dynamic = 'force-dynamic'

export default async function CatalogueDetailPage({params}: {params: Promise<{locale: string; code: string}>}) {
    const {locale, code} = await params
    if (!isLocale(locale)) notFound()

    const catalogues = await getCatalogueDirectory()
    const catalogue = catalogues.find(c => c.catalogue === code)
    if (!catalogue) notFound()

    const catalogCode = getCatalogForComposer(catalogue.composerSlug)
    if (!catalogCode) notFound()

    const composer = await getComposer(catalogue.composerSlug)
    if (!composer) notFound()

    const {t} = await getI18n(locale)

    const lifespan = [composer.startDate, composer.endDate].filter(Boolean).join('–') || null
    const composerDisplayName = getLocalizedComposerName(composer.name, composer.aliases, locale)
    const composerNameWidth = Array.from(composerDisplayName).reduce(
        (width, character) => width + (/[\u2E80-\u9FFF\uF900-\uFAFF]/u.test(character) ? 1 : 0.52),
        0,
    )
    const ComposerHeading = 'h2'

    const catalogueDisplayName = composer.catalogueName?.trim()
        || `${composer.nameSort?.split(',')[0]?.trim() || composer.name}'s works`

    return (
        <AppShell active="catalogues">
            <CatalogueWorkspace catalogues={catalogues} currentCatalogue={code} locale={locale}>
                <main className="min-h-full">
                    <div className="mx-auto max-w-300 px-5 py-4 lg:px-10 lg:py-5">
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
                        <div className="flex min-w-0 flex-col gap-4">
                        <section className="flex min-w-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:max-h-[459.2px] sm:p-5">
                            <div className="@container flex min-h-0 min-w-0 flex-1 flex-col">
                                <ComposerHeading
                                    className="heading whitespace-nowrap font-semibold leading-tight tracking-tight text-slate-950"
                                    style={{
                                        fontSize: `clamp(1rem, calc(100cqw / ${Math.max(composerNameWidth, 1)}), 1.875rem)`,
                                    }}
                                >
                                    {composerDisplayName}
                                </ComposerHeading>
                                {(composer.nationalities.length > 0 || lifespan) && (
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                        {composer.nationalities.map(code => {
                                            const flagCode = getCountryFlagCode(code)
                                            return flagCode ? (
                                                <span key={code} className={`fi fi-${flagCode}`} role="img" aria-label={`Nationality: ${code}`} title={code}>
                                                </span>
                                            ) : null
                                        })}
                                        {lifespan && <span>{lifespan}</span>}
                                    </div>
                                )}
                                {composer.biography && (
                                    <p className="mt-3 text-sm leading-6 text-slate-600">{composer.biography}</p>
                                )}
                                {composer.wikiQID && (
                                    <div className="mt-3 min-h-0 flex-1 overflow-y-auto border-t border-slate-100 pt-3">
                                        <GenreIntroduction wikiID={composer.wikiQID} locale={locale}/>
                                    </div>
                                )}
                            </div>
                        </section>
                        <section className="flex min-w-0 flex-col justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            {catalogCode === 'KV' && <RefreshCatalogueWorksButton catalogCode={catalogCode}/>}
                            <h2 className="heading wrap-break-word text-base font-semibold leading-tight tracking-tight text-slate-900">
                                {catalogueDisplayName}
                            </h2>
                            {catalogue.cataloguerName && (
                                <p className="mt-1 text-xs text-slate-500">{t('catalogues.cataloguer', {name: catalogue.cataloguerName})}</p>
                            )}
                            {catalogCode === 'KV' && (
                                <a
                                    href={KV_API_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1.5 inline-flex w-fit items-center gap-1 text-xs text-slate-500 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-700 hover:decoration-slate-500"
                                >
                                    {t('catalogues.kvDataSource')}
                                </a>
                            )}
                            {composer.spotify && (
                                <section className="mt-4 flex min-w-0 flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                    <h2 className="heading wrap-break-word text-base font-semibold leading-tight tracking-tight text-slate-900">
                                        {t('catalogues.spotify')}
                                    </h2>
                                    <SpotifyEmbed uri={composer.spotify} className="w-full"/>
                                </section>
                            )}
                        </section>
                        </div>

                        <Suspense fallback={<WorksLoading label={t('works.loading')}/>}>
                            <CatalogWorksPanel locale={locale} catalogCode={catalogCode}/>
                        </Suspense>
                    </div>
                    </div>
                </main>
            </CatalogueWorkspace>
        </AppShell>
    )
}
