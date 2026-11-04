import AppShell from '@/components/AppShell'
import CatalogWorksPanel from '@/components/catalogues/CatalogWorksPanel'
import WorksLoading from '@/components/catalogues/WorksLoading'
import RefreshCatalogueWorksButton from '@/components/catalogues/RefreshCatalogueWorksButton'
import CatalogueWorkspace from '@/components/catalogues/CatalogueWorkspace'
import CatalogueCitation from '@/components/catalogues/CatalogueCitation'
import SpotifyEmbed from '@/components/catalogues/SpotifyEmbed'
import {getCatalogueDirectory, getComposer} from '@/lib/db/composers'
import {getCatalogForComposer} from '@/lib/data/composer-catalog-map'
import {getI18n} from '@/lib/i18n/server'
import {getPageTitle} from '@/lib/page-title'
import {isLocale} from '@/lib/i18n/config'
import {notFound} from 'next/navigation'

import {Suspense} from 'react'

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

    const referenceTitle = composer.catalogRefUrl ? await getPageTitle(composer.catalogRefUrl) : null

    const catalogueDisplayName = composer.catalogueName?.trim()
        || `${composer.nameSort?.split(',')[0]?.trim() || composer.name}'s works`

    return (
        <AppShell active="catalogues">
            <CatalogueWorkspace catalogues={catalogues} currentCatalogue={code} locale={locale}>
                <main className="min-h-full">
                    <div className="mx-auto max-w-300 px-5 py-4 lg:px-10 lg:py-5">
                    <div className="mt-4 flex flex-col gap-4">
                        <h1 className="heading wrap-break-word text-2xl font-semibold leading-tight tracking-tight text-slate-950">
                            {catalogueDisplayName}
                        </h1>
                        {catalogCode === 'KV' && <RefreshCatalogueWorksButton catalogCode={catalogCode}/>}
                        {composer.spotify && (
                            <section className="flex min-w-0 flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                <h2 className="heading wrap-break-word text-base font-semibold leading-tight tracking-tight text-slate-900">
                                    {t('catalogues.spotify')}
                                </h2>
                                <SpotifyEmbed uri={composer.spotify} className="w-full"/>
                            </section>
                        )}

                        {composer.catalogRef && (
                            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                <CatalogueCitation
                                    title={composer.catalogRef}
                                    href={composer.catalogRefUrl}
                                    linkLabel={referenceTitle ?? t('catalogues.reference')}
                                    author={composer.cataloguerName || undefined}
                                    publisher={composer.catalogPublisher}
                                    className="text-sm leading-6 text-slate-600"
                                />
                            </section>
                        )}

                        <div className="flex min-w-0 flex-col gap-4">
                            <Suspense fallback={<WorksLoading label={t('works.loading')}/>}>
                                <CatalogWorksPanel locale={locale} catalogCode={catalogCode}/>
                            </Suspense>
                        </div>
                    </div>
                    </div>
                </main>
            </CatalogueWorkspace>
        </AppShell>
    )
}
