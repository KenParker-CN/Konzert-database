import type {Metadata} from 'next'
import AppShell from '@/components/AppShell'
import InstrumentBreadcrumb from '@/components/instruments/InstrumentBreadcrumb'
import GenreIntroduction from '@/components/genres/GenreIntroduction'
import {getInstrumentFamilies} from '@/lib/db/instruments'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {IconArrowUpRight} from '@tabler/icons-react'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({params}: {params: Promise<{locale: string; familyKey: string}>}): Promise<Metadata> {
    const {locale, familyKey} = await params
    if (!isLocale(locale)) notFound()
    const family = (await getInstrumentFamilies(locale)).find(candidate => candidate.key === familyKey)
    return {title: family ? `${family.label} · Konzert` : undefined, alternates: {canonical: `/${locale}/instruments/family/${familyKey}`}}
}

export default async function InstrumentFamilyPage({params}: {params: Promise<{locale: string; familyKey: string}>}) {
    const {locale, familyKey} = await params
    if (!isLocale(locale)) notFound()

    const [{t}, families] = await Promise.all([
        getI18n(locale),
        getInstrumentFamilies(locale),
    ])
    const family = families.find(candidate => candidate.key === familyKey)
    if (!family) notFound()

    return (
        <AppShell active="instruments">
            <main className="min-h-full">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <InstrumentBreadcrumb items={[
                        {label: t('navigation.instruments'), href: localePath(locale, '/instruments')},
                        {label: family.label},
                    ]}/>
                    <header className="mb-8">
                        <h1 className="heading text-3xl font-semibold tracking-tight text-slate-950">{family.label}</h1>
                        <p className="mt-2 text-sm font-medium text-slate-600">{t('instruments.count', {count: family.items.length})}</p>
                        <GenreIntroduction wikiID={family.wikiID} locale={locale}/>
                    </header>
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {family.items.map(item => (
                            <li key={item.abbrev}>
                                <Link
                                    href={localePath(locale, `/instruments/${encodeURIComponent(item.abbrev)}`)}
                                    className="group flex min-h-20 items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                >
                                    <span className="min-w-0">
                                        <span className="heading block text-base font-semibold text-slate-900">{item.label}</span>
                                        <span className="mt-1 block text-xs text-slate-500">{t('works.count', {count: item.count})}</span>
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
