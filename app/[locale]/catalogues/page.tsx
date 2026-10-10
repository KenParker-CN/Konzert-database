import AppShell from '@/components/AppShell'
import PageHeader from '@/components/PageHeader'
import {getCatalogueDirectory} from '@/lib/db/composers'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {getLocalizedComposerName} from '@/lib/composer-name'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CataloguesPage({params}: {params: Promise<{locale: string}>}) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()

    const [{t}, catalogues] = await Promise.all([
        getI18n(locale),
        getCatalogueDirectory().catch(() => []),
    ])

    return <AppShell active="catalogues">
        <main className="min-h-screen">
            <div className="mx-auto max-w-360 px-5 py-10 lg:px-10 lg:py-14">
                <PageHeader
                    badge={t('catalogues.badge')}
                    title={t('catalogues.title')}
                    description={t('catalogues.description')}
                />
                <p className="mb-4 text-sm text-slate-500">
                    {t('catalogues.count', {count: catalogues.length})}
                </p>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {catalogues.map(({catalogue, composerName, composerAliases, composerSlug, workCount}, index) => {
                        const displayName = getLocalizedComposerName(composerName, composerAliases, locale)
                        return (
                        <Link
                            key={catalogue}
                            href={localePath(locale, `/catalogues/${catalogue}`)}
                            className="group flex min-w-0 flex-col border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
                        >
                            <div className={`relative flex aspect-[4/3] flex-col justify-between overflow-hidden border border-white/10 p-5 text-white ${
                                index % 4 === 0
                                    ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950'
                                    : index % 4 === 1
                                      ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950'
                                      : index % 4 === 2
                                        ? 'bg-gradient-to-br from-rose-950 via-slate-900 to-orange-950'
                                        : 'bg-gradient-to-br from-amber-950 via-slate-900 to-yellow-950'
                            }`}>
                                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                                    {t('catalogues.coverLabel')}
                                </span>
                                <span aria-hidden="true" className="absolute -right-10 -top-10 size-44 border border-white/10"/>
                                <span aria-hidden="true" className="absolute -right-5 -top-5 size-32 border border-white/10"/>
                                <div className="relative">
                                    <p className="heading text-4xl font-semibold tracking-tight sm:text-5xl">{catalogue}</p>
                                    <div className="mt-3 h-px w-12 bg-white/60"/>
                                    <p className="mt-3 line-clamp-2 text-sm text-white/80">{displayName}</p>
                                </div>
                                <span className="text-xs font-medium text-white/60">
                                    {t('works.count', {count: workCount})}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 px-1 pt-4">
                                <span className="truncate text-sm font-semibold text-slate-900">{displayName}</span>
                                <span className="shrink-0 text-sm font-medium text-blue-600 group-hover:text-blue-700">
                                    {t('catalogues.browse')}
                                </span>
                            </div>
                        </Link>
                    )})}
                </div>
            </div>
        </main>
    </AppShell>
}
