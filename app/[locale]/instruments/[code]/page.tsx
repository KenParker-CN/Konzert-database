import AppShell from '@/components/AppShell'
import {getLocalizedComposerName} from '@/lib/composer-name'
import {getInstrumentRef, getInstrumentWorks} from '@/lib/db/instruments'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

const INSTRUMENT_WORK_LIMIT = 300

export default async function InstrumentPage({params}: {params: Promise<{locale: string; code: string}>}) {
    const {locale, code} = await params
    if (!isLocale(locale)) notFound()

    const ref = getInstrumentRef(code)
    if (!ref) notFound()

    const [{t}, works] = await Promise.all([
        getI18n(locale),
        getInstrumentWorks(ref.item.abbrev),
    ])
    const shownWorks = works.slice(0, INSTRUMENT_WORK_LIMIT)

    return (
        <AppShell>
            <main>
                <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
                    <Link href={localePath(locale, '/instruments')} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        ← {t('instruments.back')}
                    </Link>
                    <header className="mb-8 mt-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{ref.group[locale]}</p>
                        <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                            {ref.item[locale]}
                        </h1>
                        <p className="mt-3 text-sm font-medium text-slate-600">
                            {t('works.count', {count: works.length})}
                            {works.length > shownWorks.length && ` · ${t('instruments.showing', {shown: shownWorks.length, total: works.length})}`}
                        </p>
                    </header>
                    <ul className="grid gap-3">
                        {shownWorks.map(work => (
                            <li key={`${work.catalogueCode}-${work.sort}-${work.catalogueNumber}-${work.title}`}>
                                <Link
                                    href={localePath(locale, `/catalogues/${encodeURIComponent(work.catalogueCode)}`)}
                                    className="flex flex-col gap-1 border border-slate-200 bg-white px-5 py-3 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                >
                                    <span className="text-sm font-semibold text-slate-900">{work.title || work.catalogueNumber}</span>
                                    <span className="text-xs text-slate-600">
                                        {[getLocalizedComposerName(work.composerName, work.composerAliases, locale), work.catalogueNumber].filter(Boolean).join(' · ')}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
        </AppShell>
    )
}
