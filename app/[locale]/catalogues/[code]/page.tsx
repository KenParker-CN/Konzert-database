import AppShell from '@/components/AppShell'
import CatalogWorksPanel from '@/components/catalogues/CatalogWorksPanel'
import WorksLoading from '@/components/catalogues/WorksLoading'
import RefreshCatalogueWorksButton from '@/components/catalogues/RefreshCatalogueWorksButton'
import CatalogueWorkspace from '@/components/catalogues/CatalogueWorkspace'
import SpotifyEmbed from '@/components/catalogues/SpotifyEmbed'
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
    const catalogueDisplayName = composer.catalogueName?.trim()
        || `${composer.nameSort?.split(',')[0]?.trim() || composer.name}'s works`

    return (
        <AppShell active="catalogues">
            <CatalogueWorkspace catalogues={catalogues} currentCatalogue={code} locale={locale}>
                <main className="min-h-full">
                    <div className="mx-auto max-w-300 px-5 py-4 lg:px-10 lg:py-5">
                    <div className="mt-4 flex flex-col gap-4">
                        <div className="flex min-w-0 flex-col gap-4">
                        <section className="flex min-w-0 flex-col justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            {catalogCode === 'KV' && <RefreshCatalogueWorksButton catalogCode={catalogCode}/>}
                            <h2 className="heading wrap-break-word text-base font-semibold leading-tight tracking-tight text-slate-900">
                                {catalogueDisplayName}
                            </h2>
                            {catalogue.cataloguerName && (
                                <p className="mt-1 text-xs text-slate-500">{t('catalogues.cataloguer', {name: catalogue.cataloguerName})}</p>
                            )}
                            {catalogCode === 'Stattkus' && (
                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                    Manfred H. Stattkus; <em>Claudio Monteverdi: Verzeichnis der erhaltenen Werke (SV)</em>; Musikverlag Stattkus, 1985
                                </p>
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

                        <div className="flex min-w-0 flex-col gap-4">
                            <Suspense fallback={<WorksLoading label={t('works.loading')}/>}>
                                <CatalogWorksPanel locale={locale} catalogCode={catalogCode}/>
                            </Suspense>
                            <section className="mt-2 border-t border-slate-200 pt-4 text-sm text-slate-500">
                                <p className="font-medium text-slate-600">{composerDisplayName}</p>
                                {(composer.nationalities.length > 0 || lifespan) && (
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
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
                                    <p className="mt-2 text-xs leading-5 text-slate-500">{composer.biography}</p>
                                )}
                            </section>
                        </div>
                    </div>
                    </div>
                </main>
            </CatalogueWorkspace>
        </AppShell>
    )
}
