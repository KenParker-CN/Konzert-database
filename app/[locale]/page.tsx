import type {Metadata} from 'next'
import AppShell from '../../components/AppShell'
import {isLocale} from '@/lib/i18n/config'
import {getI18n} from '@/lib/i18n/server'
import {getCatalogueDirectory, getRandomWikiBannerItems} from '@/lib/db/composers'
import {getLocalizedComposerName} from '@/lib/composer-name'
import {localePath} from '@/lib/i18n/config'
import CountTo from '@/components/home/CountTo'
import WikiRandomBanner from '@/components/home/WikiRandomBanner'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {IconDisc, IconMail} from '@tabler/icons-react'

export const dynamic = 'force-dynamic'

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
    const {locale} = await params
    return {alternates: {canonical: `/${locale}`}}
}

export default async function HomePage({params}: {params: Promise<{locale: string}>}) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()
    const {t} = await getI18n(locale)
    const [directory, wikiBannerItems] = await Promise.all([getCatalogueDirectory(), getRandomWikiBannerItems(locale)])
    const composerCount = directory.length
    const workCount = directory.reduce((sum, entry) => sum + (entry.workCount ?? 0), 0)
    const featuredCatalogues = [...directory].sort((a, b) => b.workCount - a.workCount).slice(0, 3)

    return (
        <AppShell>
            <main>
                <section className="mx-auto grid max-w-7xl items-center gap-5 px-5 py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:items-stretch lg:px-8">
                    <div className="flex max-w-5xl flex-col justify-center">
                        <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                            <span className="h-px w-8 bg-blue-600"/>{t('home.badge')}
                        </p>
                        <h1 className="heading max-w-4xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
                            Konzert
                        </h1>
                        <div className="mt-4 flex items-baseline gap-5 text-xs text-slate-500">
                            <span className="flex items-baseline gap-1.5">
                                <span className="text-base font-semibold text-slate-950"><CountTo value={composerCount}/></span>
                                {t('home.composers')}
                            </span>
                            <span className="flex items-baseline gap-1.5">
                                <span className="text-base font-semibold text-slate-950"><CountTo value={workCount}/></span>
                                {t('home.works')}
                            </span>
                        </div>
                    </div>
                    <WikiRandomBanner
                        items={wikiBannerItems}
                        locale={locale}
                        title={t('home.randomWiki.title')}
                        kindLabels={{
                            composer: t('home.randomWiki.composer'),
                            genre: t('home.randomWiki.genre'),
                            work: t('home.randomWiki.work'),
                        }}
                    />
                </section>
                <section className="mx-auto max-w-7xl px-5 pb-6 lg:px-8">
                    <div className="mb-5 flex items-end justify-between gap-4">
                        <h2 className="heading text-2xl font-semibold tracking-tight text-slate-950">{t('home.highlights')}</h2>
                        <Link href={localePath(locale, '/catalogues')} className="text-sm font-semibold text-blue-600 hover:underline">
                            {t('catalogues.title')}
                        </Link>
                    </div>
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {featuredCatalogues.map(entry => (
                            <li key={entry.catalogue}>
                                <Link
                                    href={localePath(locale, `/catalogues/${entry.catalogue}`)}
                                    className="group flex min-h-20 flex-col justify-between gap-4 border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                >
                                    <span className="heading text-base font-semibold text-slate-900">{entry.catalogueName ?? entry.catalogue}</span>
                                    <span className="text-sm text-slate-600">{getLocalizedComposerName(entry.composerName, entry.composerAliases, locale)}</span>
                                    <span className="text-xs text-slate-500">{t('works.count', {count: entry.workCount})}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>
            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4 lg:px-8">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <span className="heading text-lg font-semibold tracking-tight text-slate-950">
                            Konzert
                        </span>
                        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
                            {[
                                ['composers', '/composers'],
                                ['catalogues', '/catalogues'],
                                ['instruments', '/instruments'],
                                ['genres', '/genres'],
                            ].map(([key, href]) => (
                                <Link key={key} href={localePath(locale, href)} className="hover:text-blue-600">
                                    {t(`navigation.${key}`)}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <p className="max-w-md text-sm leading-6 text-slate-600">{t('home.tagline')}</p>
                        <div className="flex items-center gap-2 text-slate-500">
                            <a href="https://musicbrainz.org/user/KenParker_CN" target="_blank" rel="noopener noreferrer" aria-label="MusicBrainz" className="rounded-md p-2 text-[#ba478f] hover:bg-slate-100 hover:opacity-80">
                                <IconDisc size={18}/>
                            </a>
                            <a href="mailto:kenparkercn@gmail.com" aria-label="Email" className="rounded-md p-2 hover:bg-slate-100 hover:text-blue-600">
                                <IconMail size={18}/>
                            </a>
                        </div>
                    </div>
                </div>
                <div className="border-t border-slate-100">
                    <p className="mx-auto max-w-7xl px-5 py-2 text-center text-xs text-slate-500 lg:px-8">
                        © {new Date().getFullYear()} Ken Parker
                    </p>
                </div>
            </footer>
        </AppShell>
    )
}
