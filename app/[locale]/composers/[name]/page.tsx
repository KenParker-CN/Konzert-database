import AppShell from '@/components/AppShell'
import WikipediaIntro from '@/components/common/WikipediaIntro'
import ComposerWorksPanel from '@/components/common/ComposerWorksPanel'
import WorksLoading from '@/components/common/WorksLoading'
import {ArrowLeft} from 'lucide-react'
import Image from 'next/image'
import {getComposer} from '@/lib/db/composers'
import {notFound} from 'next/navigation'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {getCatalogForComposer} from '@/lib/data/composer-catalog-map'
import {getComposerAvatarSource} from '@/lib/composer-avatar'
import {getCountryFlagCode, getLocalizedComposerName} from '@/lib/composer-name'
import {Suspense} from 'react'

export const dynamic = 'force-dynamic'

export default async function ComposerDetailPage({params}: { params: Promise<{ locale: string; name: string }> }) {
    const {locale, name} = await params
    if (!isLocale(locale)) notFound()

    const composer = await getComposer(name)
    if (!composer) notFound()

    const catalogCode = getCatalogForComposer(composer.slug)
    const {t} = await getI18n(locale)

    const lifespan = [composer.startDate, composer.endDate].filter(Boolean).join('–') || null
    const displayName = getLocalizedComposerName(composer.name, composer.aliases, locale)
    const avatarSrc = getComposerAvatarSource(composer.slug) || '/src/composer.png'

    return (
        <AppShell active="composers">
            <main className="min-h-screen">
                <div className="mx-auto max-w-300 px-5 py-10 lg:px-10 lg:py-14">
                    <a href={localePath(locale, '/composers')}
                       className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                        <ArrowLeft size={16}/>
                        {t('composers.allComposers')}
                    </a>

                    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(200px,240px)_minmax(0,1fr)]">
                            <div className="-ml-3 flex h-[240px] max-h-[240px] self-center items-center justify-center overflow-hidden rounded-xl sm:-ml-4">
                                <Image src={avatarSrc} alt="" width={512} height={640} className="h-[240px] w-auto max-w-full object-contain"/>
                            </div>

                            <div className="flex min-w-0 flex-col justify-between gap-6">
                                <div>
                                    <h1 className="heading wrap-break-word text-2xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-3xl">{displayName}</h1>
                                    {(composer.nationalities.length > 0 || lifespan) && (
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
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

                                <div className="p-2.5">
                                    <WikipediaIntro name={composer.name}/>
                                </div>
                            </div>
                        </div>
                    </section>

                    <Suspense fallback={<WorksLoading label={t('works.loading')}/>}>
                        <ComposerWorksPanel
                            locale={locale}
                            artistId={composer.artistId}
                            catalogCode={catalogCode}
                            composerName={composer.name}
                            startDate={composer.startDate}
                        />
                    </Suspense>
                </div>
            </main>
        </AppShell>
    )
}
