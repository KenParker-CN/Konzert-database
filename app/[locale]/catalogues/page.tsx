import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'
import RefreshCatalogueCacheButton from '@/components/catalogues/RefreshCatalogueCacheButton'
import {IconListDetails} from '@tabler/icons-react'
import {getCatalogueDirectory} from '@/lib/db/composers'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath, type Locale} from '@/lib/i18n/config'
import type {Translator} from '@/lib/i18n/core'
import {getLocalizedComposerName} from '@/lib/composer-name'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

type CatalogueEntry = Awaited<ReturnType<typeof getCatalogueDirectory>>[number]

function renderCompositionListRow(
    {catalogue, composerName, composerAliases, workCount}: CatalogueEntry,
    locale: Locale,
    t: Translator,
) {
    const displayName = getLocalizedComposerName(composerName, composerAliases, locale)
    return (
        <Link
            key={catalogue}
            href={localePath(locale, `/catalogues/${catalogue}`)}
            className="group flex min-w-0 items-center gap-3 border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
        >
            <IconListDetails aria-hidden="true"
                             className="shrink-0 text-slate-400 transition group-hover:text-blue-600"/>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                {t('catalogues.compositionList', {composer: displayName})}
            </span>
            <span className="shrink-0 text-xs text-slate-500">
                {t('works.count', {count: workCount})}
            </span>
        </Link>
    )
}

export default async function CataloguesPage({params}: {params: Promise<{locale: string}>}) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()

    const [{t}, catalogues] = await Promise.all([
        getI18n(locale),
        getCatalogueDirectory().catch(() => []),
    ])

    const namedCatalogues = catalogues.filter(entry => entry.hasCatalogueName)
    const compositionLists = catalogues.filter(entry => !entry.hasCatalogueName)

    return <AppShell active="catalogues">
        <main className="min-h-screen">
            <div className="mx-auto max-w-360 px-5 py-10 lg:px-10 lg:py-14">
                <PageHeader
                    badge={t('catalogues.badge')}
                    title={t('catalogues.title')}
                    description={t('catalogues.description')}
                />
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">
                        {t('catalogues.count', {count: catalogues.length})}
                    </p>
                    <RefreshCatalogueCacheButton/>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {namedCatalogues.map(({catalogue, composerName, composerAliases, workCount}, index) => {
                        const displayName = getLocalizedComposerName(composerName, composerAliases, locale)
                        const coverPalette = ['indigo', 'emerald', 'rose', 'amber'][index % 4]
                        return (
                            <Link
                                key={catalogue}
                                href={localePath(locale, `/catalogues/${catalogue}`)}
                                className="group flex min-w-0 flex-col border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
                            >
                                <div className={`catalogue-cover catalogue-cover--${coverPalette} relative flex aspect-4/3 flex-col justify-between overflow-hidden border p-5`}>
                                    <span className="catalogue-cover__label text-[10px] font-semibold uppercase tracking-[0.22em]">
                                        {t('catalogues.coverLabel')}
                                    </span>
                                    <span aria-hidden="true" className="catalogue-cover__ornament absolute -right-10 -top-10 size-44 border"/>
                                    <span aria-hidden="true" className="catalogue-cover__ornament absolute -right-5 -top-5 size-32 border"/>
                                    <div className="relative">
                                        <p className="heading text-4xl font-semibold tracking-tight sm:text-5xl">{catalogue}</p>
                                        <div className="catalogue-cover__rule mt-3 h-px w-12"/>
                                        <p className="catalogue-cover__composer mt-3 line-clamp-2 text-sm">{displayName}</p>
                                    </div>
                                    <span className="catalogue-cover__label text-xs font-medium">
                                        {t('works.count', {count: workCount})}
                                    </span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
                {compositionLists.length > 0 && (
                    <section className="mt-8 flex flex-col gap-3">
                        <h2 className="heading text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {t('catalogues.compositionListsHeading')}
                        </h2>
                        {compositionLists.map(entry => renderCompositionListRow(entry, locale, t))}
                    </section>
                )}
            </div>
        </main>
    </AppShell>
}
