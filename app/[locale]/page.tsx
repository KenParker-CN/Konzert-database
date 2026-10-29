import AppShell from '../../components/AppShell'
import {isLocale, localePath} from '@/lib/i18n/config'
import {getI18n} from '@/lib/i18n/server'
import {getCatalogueDirectory} from '@/lib/db/composers'
import CountTo from '@/components/common/CountTo'
import {notFound} from 'next/navigation'
import {IconArrowUpRight} from '@tabler/icons-react'

export default async function HomePage({params}: {params: Promise<{locale: string}>}) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()
    const {t} = await getI18n(locale)
    const directory = await getCatalogueDirectory()
    const composerCount = directory.length
    const workCount = directory.reduce((sum, entry) => sum + (entry.workCount ?? 0), 0)

    return (
        <AppShell>
            <main className="min-h-[calc(100dvh-4rem)]">
                <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-5 px-5 py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:px-8">
                    <div className="max-w-5xl py-4 sm:py-6">
                        <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                            <span className="h-px w-8 bg-blue-600"/>{t('home.badge')}
                        </p>
                        <h1 className="heading max-w-4xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
                            Parker’s<span className="text-blue-600">.</span>
                        </h1>
                        <a href={localePath(locale, '/catalogues')} className="mt-7 inline-flex items-center gap-2 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                            {t('navigation.catalogues')}<IconArrowUpRight size={16}/>
                        </a>
                        <div className="mt-8 grid max-w-md grid-cols-2 gap-4">
                            <div className="border border-slate-200 bg-white/80 p-4 shadow-sm">
                                <div className="text-3xl font-semibold tracking-tight text-slate-950">
                                    <CountTo value={composerCount}/>
                                </div>
                                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('home.composers')}</div>
                            </div>
                            <div className="border border-slate-200 bg-white/80 p-4 shadow-sm">
                                <div className="text-3xl font-semibold tracking-tight text-slate-950">
                                    <CountTo value={workCount}/>
                                </div>
                                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('home.works')}</div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </AppShell>
    )
}
