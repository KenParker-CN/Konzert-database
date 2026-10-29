import AppShell from '@/components/AppShell'
import CatalogueWorkspace from '@/components/catalogues/CatalogueWorkspace'
import {getCatalogueDirectory} from '@/lib/db/composers'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath, type Locale} from '@/lib/i18n/config'
import type {Translator} from '@/lib/i18n/core'
import {getLocalizedComposerName} from '@/lib/composer-name'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

type CatalogueEntry = Awaited<ReturnType<typeof getCatalogueDirectory>>[number]

function renderCatalogueCard(
    {catalogue, catalogueName, composerName, composerAliases, workCount}: CatalogueEntry,
    locale: Locale,
    t: Translator,
) {
    const displayName = getLocalizedComposerName(composerName, composerAliases, locale)
    const catalogueLabel = catalogueName ?? catalogue
    return (
        <Link
            key={catalogue}
            href={localePath(locale, `/catalogues/${catalogue}`)}
            className="group flex min-h-20 flex-col justify-between gap-4 border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-2">
                <span className="heading text-base font-semibold text-slate-900">{catalogueLabel}</span>
            </div>
            <span className="text-sm text-slate-600">{displayName}</span>
            <span className="text-xs text-slate-500">{t('works.count', {count: workCount})}</span>
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

    return (
        <AppShell active="catalogues">
            <CatalogueWorkspace catalogues={catalogues} currentCatalogue="" locale={locale}>
                <main className="min-h-full">
                    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
                        <header className="mb-8">
                            <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                                {t('catalogues.title')}
                            </h1>
                            <p className="mt-3 text-sm font-medium text-slate-600">
                                {t('catalogues.count', {count: catalogues.length})}
                            </p>
                        </header>
                        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {catalogues.map(entry => renderCatalogueCard(entry, locale, t))}
                        </ul>
                    </div>
                </main>
            </CatalogueWorkspace>
        </AppShell>
    )
}
