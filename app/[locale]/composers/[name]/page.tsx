import AppShell from '@/components/AppShell'
import WikipediaIntro from '@/components/common/WikipediaIntro'
import WorksTable from '../WorksTable'
import MarqueeText from '@/components/common/MarqueeText'
import {ArrowLeft} from 'lucide-react'
import {
    getComposer,
    getComposerWorks,
} from '@/lib/db/composers'
import {notFound} from 'next/navigation'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {getCatalogForComposer} from '@/lib/data/composer-catalog-map'

export const dynamic = 'force-dynamic'

function year(date: string | null) {
    return date?.slice(0, 4) ?? null
}

export default async function ComposerDetailPage({params}: { params: Promise<{ locale: string; name: string }> }) {
    const {locale, name} = await params
    if (!isLocale(locale)) notFound()

    const composer = await getComposer(name)
    if (!composer) notFound()

    const works = await getComposerWorks(composer.artistId)
    const catalogCode = getCatalogForComposer(composer.slug)

    const {t} = await getI18n(locale)

    const start = year(composer.startDate)
    const end = year(composer.endDate)
    const lifespan = start || end ? `${start ?? '?'}–${end ?? ''}` : null

    return (
        <AppShell active="composers">
            <main className="min-h-screen">
                <div className="mx-auto max-w-300 px-5 py-10 lg:px-10 lg:py-14">
                    <a href={localePath(locale, '/composers')}
                       className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                        <ArrowLeft size={16}/>
                        {t('composers.allComposers')}
                    </a>

                    {/* Composer information */}
                    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
                            <div className="flex shrink-0 flex-col gap-5 sm:flex-row sm:items-center lg:flex-col lg:items-start lg:w-64">
                                <div
                                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-3xl font-semibold text-blue-700">{composer.name.slice(0, 1)}</div>
                                <div className="min-w-0">
                                    <MarqueeText className="heading text-3xl font-semibold tracking-tight text-slate-950">{composer.name}</MarqueeText>
                                    {lifespan && (
                                        <p className="mt-1 text-sm text-slate-500">{lifespan}</p>
                                    )}
                                    {composer.biography && (
                                        <p className="mt-2 text-sm text-slate-600">{composer.biography}</p>
                                    )}
                                </div>
                            </div>

                            {/* Wikipedia introduction (client-fetched) - moved to right side */}
                            <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                                <WikipediaIntro name={composer.name}/>
                            </div>
                        </div>
                    </section>

                    {/* Works (only rendered when data exists) */}
                    {(works.length > 0 || !catalogCode) && (
                        <section className="mt-8">
                            <div className="mb-3">
                                <h2 className="heading text-2xl font-semibold">{t('works.title')}</h2>
                            </div>
                            {catalogCode && works.length > 0 ? (
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <WorksTable works={works} catalogCode={catalogCode}/>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
                                    {t('composers.catalogueNotConnected')}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </main>
        </AppShell>
    )
}
