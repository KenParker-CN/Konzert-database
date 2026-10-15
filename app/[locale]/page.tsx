import AppShell from '../../components/AppShell'
import {isLocale, localePath} from '@/lib/i18n/config'
import {getI18n} from '@/lib/i18n/server'
import {notFound} from 'next/navigation'
import {IconArrowUpRight, IconBook2} from '@tabler/icons-react'

export default async function HomePage({params}: { params: Promise<{ locale: string }> }) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()
    const {t} = await getI18n(locale)

    return <AppShell>
        <main className="min-h-screen">
            <section className="mx-auto max-w-7xl px-5 pb-16 pt-10 sm:pt-14 lg:px-8 lg:pb-24 lg:pt-20">
                <div className="max-w-5xl py-4 sm:py-8 lg:py-12">
                    <div className="flex flex-col justify-center">
                        <p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                            <span className="h-px w-8 bg-blue-600" />{t('home.badge')}
                        </p>
                        <h1 className="heading max-w-4xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
                            Parker’s<span className="text-blue-600">.</span>
                        </h1>
                        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">{t('home.tagline')}</p>
                        <div className="mt-9 flex flex-wrap items-center gap-3">
                            <a href={localePath(locale, '/catalogues')} className="inline-flex items-center gap-2 bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                                {t('navigation.catalogues')}<IconArrowUpRight size={16} />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-12 grid gap-px border border-slate-200 bg-slate-200 sm:mt-16 sm:grid-cols-1">
                    <a href={localePath(locale, '/catalogues')} className="group flex min-h-48 flex-col justify-between bg-white p-6 transition hover:bg-slate-50 sm:p-8">
                        <div className="flex items-start justify-between"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">01 / {t('home.collectionLabel')}</span><IconBook2 size={20} className="text-slate-400 transition group-hover:text-blue-600" /></div>
                        <div className="mt-8 flex items-end justify-between gap-4"><div><h2 className="heading text-2xl font-semibold">{t('catalogues.title')}</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{t('catalogues.description')}</p></div><IconArrowUpRight size={19} className="mb-1 shrink-0 text-blue-600" /></div>
                    </a>
                </div>
            </section>
        </main>
    </AppShell>
}
