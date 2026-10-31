import AppShell from '@/components/AppShell'
import {getInstrumentFamilies} from '@/lib/db/instruments'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {IconArrowUpRight} from '@tabler/icons-react'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function InstrumentsPage({params}: {params: Promise<{locale: string}>}) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()

    const [{t}, families] = await Promise.all([
        getI18n(locale),
        getInstrumentFamilies(locale),
    ])
    const instrumentCount = families.reduce((sum, family) => sum + family.items.length, 0)

    return (
        <AppShell active="instruments">
            <main className="min-h-full">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <header className="mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{t('navigation.instruments')}</p>
                        <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">{t('instruments.title')}</h1>
                        <p className="mt-2 text-sm font-medium text-slate-600">{t('instruments.count', {count: instrumentCount})}</p>
                    </header>
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {families.map(family => (
                            <li key={family.key}>
                                <Link
                                    href={localePath(locale, `/instruments/family/${encodeURIComponent(family.key)}`)}
                                    className="group flex min-h-20 items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                >
                                    <span className="min-w-0">
                                        <span className="heading block text-lg font-semibold text-slate-900">{family.label}</span>
                                        <span className="mt-1 block text-xs text-slate-500">{t('instruments.count', {count: family.items.length})}</span>
                                    </span>
                                    <IconArrowUpRight size={18} className="shrink-0 text-slate-400 transition group-hover:text-blue-600" aria-hidden="true"/>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
        </AppShell>
    )
}
