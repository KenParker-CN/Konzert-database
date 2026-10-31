import type {ReactNode} from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import {getI18n} from '@/lib/i18n/server'
import {localePath, type Locale} from '@/lib/i18n/config'

type InstrumentFamily = {
    key: string
    label: string
    items: {abbrev: string, label: string}[]
}

export default async function InstrumentWorkspace({
    locale,
    families,
    currentAbbrev,
    children,
}: {
    locale: Locale
    families: InstrumentFamily[]
    currentAbbrev?: string
    children: ReactNode
}) {
    const {t} = await getI18n(locale)
    const title = t('instruments.title')

    return (
        <AppShell active="instruments">
            <div className="mx-auto flex h-[calc(100dvh-4rem)] min-h-0 max-w-360 flex-col md:flex-row">
                <aside className="flex h-56 min-h-0 shrink-0 flex-col border-b border-slate-200 bg-white md:h-full md:w-72 md:border-b-0 md:border-r">
                    <div className="flex h-12 shrink-0 items-center px-3">
                        <h2 className="truncate text-sm font-semibold text-slate-800">{title}</h2>
                    </div>
                    <nav aria-label={title} className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
                        {families.map(family => (
                            <section key={family.key} className="mb-3">
                                <h3 className="px-2.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">{family.label}</h3>
                                <ul className="flex flex-col gap-1">
                                    {family.items.map(item => {
                                        const active = item.abbrev === currentAbbrev
                                        return (
                                            <li key={item.abbrev}>
                                                <Link
                                                    href={localePath(locale, `/instruments/${encodeURIComponent(item.abbrev)}`)}
                                                    aria-current={active ? 'page' : undefined}
                                                    className={`block truncate rounded-md px-2.5 py-2 text-sm leading-5 transition-colors ${active ? 'bg-blue-50 font-semibold text-blue-700' : 'font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950'}`}
                                                >
                                                    {item.label}
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </section>
                        ))}
                    </nav>
                </aside>
                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
            </div>
        </AppShell>
    )
}
