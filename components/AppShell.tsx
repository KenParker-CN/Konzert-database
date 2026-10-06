'use client'

import type {ReactNode} from 'react'
import {useI18n} from '@/lib/i18n/client'
import {localePath} from '@/lib/i18n/config'
import LanguageSelector from './LanguageSelector'
import ThemeSelector from './ThemeSelector'

export default function AppShell({children, active}: {
    children: ReactNode;
    active?: 'composers' | 'catalogues'
}) {
    const {locale, t} = useI18n()
    const links = [
        ['catalogues', 'catalogues', '/catalogues'],
        ['composers', 'composers', '/composers'],
    ] as const
    return <div className="app-shell" data-page={active ?? 'home'}>
        <header className="border-b border-slate-200 bg-white">
            <div
                className="mx-auto flex max-w-360 flex-wrap items-center justify-between gap-3 px-5 py-4 lg:px-10">
                <a href={localePath(locale, '/')} className="heading text-lg font-semibold tracking-tight">Parker’s</a>
                <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm text-slate-600"><a
                    href={localePath(locale, '/')} className="hidden hover:text-slate-950 sm:block">{t('navigation.home')}</a>{links.map(([id, key, href]) =>
                    <a key={id} href={localePath(locale, href)}
                       className={active === id ? 'font-semibold text-blue-600' : 'hover:text-slate-950'}>{t(`navigation.${key}`)}</a>)}
                </nav>
                <div className="flex items-center gap-2"><LanguageSelector/><ThemeSelector/></div>
            </div>
        </header>
        {children}</div>
}
