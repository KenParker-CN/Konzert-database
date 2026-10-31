import AppShell from '@/components/AppShell'
import {getInstrumentFamilies} from '@/lib/db/instruments'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
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
            <main>
                <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
                    <header className="mb-8">
                        <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                            {t('instruments.title')}
                        </h1>
                        <p className="mt-3 text-sm font-medium text-slate-600">
                            {t('instruments.count', {count: instrumentCount})}
                        </p>
                    </header>
                    <div className="space-y-10">
                        {families.map(family => (
                            <section key={family.key}>
                                <h2 className="heading mb-4 border-b border-slate-200 pb-2 text-xl font-semibold text-slate-950">{family.label}</h2>
                                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {family.items.map(item => (
                                        <li key={item.abbrev}>
                                            <Link
                                                href={localePath(locale, `/instruments/${encodeURIComponent(item.abbrev)}`)}
                                                className="group flex min-h-20 flex-col justify-between gap-2 border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                            >
                                                <span className="heading text-base font-semibold text-slate-900">{item.label}</span>
                                                <span className="text-xs text-slate-500">{t('works.count', {count: item.count})}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                </div>
            </main>
        </AppShell>
    )
}
