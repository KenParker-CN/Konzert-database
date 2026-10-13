import AppShell from '@/components/AppShell'
import CatalogWorksPanel from '@/components/common/CatalogWorksPanel'
import WorksLoading from '@/components/common/WorksLoading'
import {ArrowLeft} from 'lucide-react'
import {getCatalogueDirectory, getComposer} from '@/lib/db/composers'
import {getCatalogForComposer} from '@/lib/data/composer-catalog-map'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import catalogueDescriptions from '@/lib/data/catalogue-descriptions.json'

type CatalogueDescription = (typeof catalogueDescriptions)[keyof typeof catalogueDescriptions]
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
    const ComposerHeading = 'h2'

    const catalogueDisplayName = composer.catalogueName?.trim()
        || `${composer.nameSort?.split(',')[0]?.trim() || composer.name}'s works`
    const catalogueInfo = (catalogueDescriptions as Record<string, CatalogueDescription | undefined>)[code]

    return (
        <AppShell active="catalogues">
            <main className="min-h-screen">
                <div className="mx-auto max-w-300 px-5 py-10 lg:px-10 lg:py-14">
                    <Link href={localePath(locale, '/catalogues')}
                       className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                        <ArrowLeft size={16}/>
                        {t('catalogues.allCatalogues')}
                    </Link>

                    <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
                        <div className="flex min-w-0 flex-col gap-6">
                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                                <div className="min-w-0 text-center">
                                    <ComposerHeading className="heading wrap-break-word text-2xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-3xl">{composerDisplayName}</ComposerHeading>
                                    {(composer.nationalities.length > 0 || lifespan) && (
                                        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
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
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex min-w-0 flex-col text-center">
                                    <h1 className="heading text-2xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-3xl">
                                        {catalogueDisplayName}
                                    </h1>
                                    {catalogueInfo?.compiler?.name && (
                                        <p className="mt-2 text-sm text-slate-500">{catalogueInfo.compiler.name}</p>
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="min-w-0">
                            <Suspense fallback={<WorksLoading label={t('works.loading')}/>}>
                                <CatalogWorksPanel locale={locale} catalogCode={catalogCode}/>
                            </Suspense>
                        </div>
                    </div>
                </div>
            </main>
        </AppShell>
    )
}
