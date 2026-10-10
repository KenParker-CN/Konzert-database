import AppShell from '@/components/AppShell'
import CatalogWorksPanel from '@/components/common/CatalogWorksPanel'
import WorksLoading from '@/components/common/WorksLoading'
import {ArrowLeft} from 'lucide-react'
import Image from 'next/image'
import {getCatalogueDirectory, getComposer} from '@/lib/db/composers'
import {getCatalogForComposer} from '@/lib/data/composer-catalog-map'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {getLocalizedComposerName} from '@/lib/composer-name'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import catalogueDescriptions from '@/lib/data/catalogue-descriptions.json'
import CatalogueNotes, {type CatalogueNotesLabels} from '@/components/catalogues/CatalogueNotes'
import {Suspense} from 'react'
import {getPostgresCatalogueEntryCount, getPostgresCatalogueInfo} from '@/lib/data/postgres'

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

    const [databaseCatalogueInfo, databaseWorkCount] = await Promise.all([
        getPostgresCatalogueInfo(code).catch(() => null),
        getPostgresCatalogueEntryCount(code).catch(() => null),
    ])
    const displayName = databaseCatalogueInfo?.composerName
        || getLocalizedComposerName(catalogue.composerName, catalogue.composerAliases, locale)
    const catalogueInfo = catalogueDescriptions[code]
    const approximateWorks = databaseWorkCount ?? catalogueInfo?.coverage?.approximateWorks
    const catalogueNotesLabels: CatalogueNotesLabels = {
        mainGroup: t('catalogues.notesMainGroup'),
        group: t('catalogues.notesGroup'),
        otherRanges: t('catalogues.notesOtherRanges'),
        specialRange: t('catalogues.notesSpecialRange'),
        mwv: t('catalogues.notesMwv'),
        classification: t('catalogues.notesClassification'),
        otherEntries: t('catalogues.notesOtherEntries'),
        vocalMusic: t('catalogues.mwvVocalMusic'),
        sacredVocalMusic: t('catalogues.mwvSacredVocalMusic'),
        secularVocalMusic: t('catalogues.mwvSecularVocalMusic'),
        stageMusic: t('catalogues.mwvStageMusic'),
        instrumentalMusic: t('catalogues.mwvInstrumentalMusic'),
        orchestralMusic: t('catalogues.mwvOrchestralMusic'),
        chamberMusic: t('catalogues.mwvChamberMusic'),
        pianoMusic: t('catalogues.mwvPianoMusic'),
        organMusic: t('catalogues.mwvOrganMusic'),
        canons: t('catalogues.mwvCanons'),
        varia: t('catalogues.mwvVaria'),
        acappellaWorks: t('catalogues.mwvAcappellaWorks'),
        singersWorks: t('catalogues.mwvSingersWorks'),
        singersAndPianoWorks: t('catalogues.mwvSingersAndPianoWorks'),
    }

    return (
        <AppShell active="catalogues">
            <main className="min-h-screen">
                <div className="mx-auto max-w-300 px-5 py-10 lg:px-10 lg:py-14">
                    <Link href={localePath(locale, '/catalogues')}
                       className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                        <ArrowLeft size={16}/>
                        {t('catalogues.allCatalogues')}
                    </Link>

                    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex flex-col gap-6">
                            <div className="flex min-w-0 items-center gap-5">
                                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl">
                                    <Image src="/src/cata.png" alt="" width={80} height={80} className="h-20 w-20 rounded-2xl object-contain"/>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1 className="heading text-2xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-3xl">
                                        {databaseCatalogueInfo?.name || `${catalogue.catalogue} ${t('catalogues.catalogue')}`}
                                    </h1>
                                    <p className="mt-1 text-sm text-slate-500">{displayName}</p>
                                    <p className="mt-2 text-sm text-slate-600">
                                        {t('works.count', {count: catalogue.workCount})}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                                <h3 className="text-sm font-semibold text-slate-900">{t('catalogues.about')}</h3>
                                <p className="mt-2 text-sm text-slate-600">
                                    {catalogueInfo?.description?.[locale] || catalogueInfo?.description?.['en'] || t('catalogues.description')}
                                </p>
                                {(databaseCatalogueInfo || catalogueInfo) && (
                                    <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs text-slate-600">
                                        {databaseCatalogueInfo?.name && (
                                            <div>
                                                <dt className="font-semibold text-slate-900">{t('catalogues.name')}</dt>
                                                <dd className="mt-0.5">{databaseCatalogueInfo.name}</dd>
                                            </div>
                                        )}
                                        {catalogueInfo.compiler?.name && (
                                            <div>
                                                <dt className="font-semibold text-slate-900">{t('catalogues.compiler')}</dt>
                                                <dd className="mt-0.5">{catalogueInfo.compiler.name}</dd>
                                            </div>
                                        )}
                                        {catalogueInfo.publication?.firstEdition && (
                                            <div>
                                                <dt className="font-semibold text-slate-900">{t('catalogues.firstEdition')}</dt>
                                                <dd className="mt-0.5">{catalogueInfo.publication.firstEdition}</dd>
                                            </div>
                                        )}
                                        {(databaseCatalogueInfo?.type || catalogueInfo?.catalogueType) && (
                                            <div>
                                                <dt className="font-semibold text-slate-900">{t('catalogues.catalogueType')}</dt>
                                                <dd className="mt-0.5">{databaseCatalogueInfo?.type || catalogueInfo?.catalogueType}</dd>
                                            </div>
                                        )}
                                        {approximateWorks !== undefined && approximateWorks !== null && (
                                            <div>
                                                <dt className="font-semibold text-slate-900">{t('catalogues.worksCount')}</dt>
                                                <dd className="mt-0.5">{approximateWorks}</dd>
                                            </div>
                                        )}
                                        {catalogueInfo?.organization?.method && (
                                            <div>
                                                <dt className="font-semibold text-slate-900">{t('catalogues.organization')}</dt>
                                                <dd className="mt-0.5">{catalogueInfo.organization.method}</dd>
                                            </div>
                                        )}
                                        {catalogueInfo?.organization?.chronological !== undefined && (
                                            <div>
                                                <dt className="font-semibold text-slate-900">{t('catalogues.chronological')}</dt>
                                                <dd className="mt-0.5">{catalogueInfo.organization.chronological ? t('common.yes') : t('common.no')}</dd>
                                            </div>
                                        )}
                                        {(() => {
                                            const notes = catalogueInfo?.notes?.[locale]?.trim() || catalogueInfo?.notes?.['en']?.trim()
                                            return notes ? (
                                                <div className="sm:col-span-2 min-w-0">
                                                    <dt className="font-semibold text-slate-900">{t('catalogues.notes')}</dt>
                                                    <dd className="mt-2 min-w-0">
                                                        <CatalogueNotes catalogueCode={code} notes={notes} labels={catalogueNotesLabels} />
                                                    </dd>
                                                </div>
                                            ) : null
                                        })()}
                                    </dl>
                                )}
                            </div>
                        </div>
                    </section>

                    <Suspense fallback={<WorksLoading label={t('works.loading')}/>}>
                        <CatalogWorksPanel locale={locale} catalogCode={catalogCode}/>
                    </Suspense>
                </div>
            </main>
        </AppShell>
    )
}
