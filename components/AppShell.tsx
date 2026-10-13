'use client'

import type {ReactNode} from 'react'
import {useI18n} from '@/lib/i18n/client'
import {localePath} from '@/lib/i18n/config'
import LanguageSelector from './LanguageSelector'
import ThemeSelector from './ThemeSelector'

export default function AppShell({children, active}: {
    children: ReactNode;
    active?: 'catalogues'
}) {
    const {locale, t} = useI18n()
    const links = [
        ['catalogues', 'catalogues', '/catalogues'],
    ] as const

    return <div className="app-shell" data-page={active ?? 'home'}>
        {children}
        <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-360 flex-col gap-6 px-5 py-7 lg:px-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <a href={localePath(locale, '/')} className="heading text-lg font-semibold tracking-tight">Parker’s</a>
                    <div className="flex items-center gap-2"><LanguageSelector/><ThemeSelector/></div>
                </div>
                <nav aria-label={t('navigation.home')} className="flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-5 text-sm text-slate-600">
                    <a href={localePath(locale, '/')} className="hover:text-slate-950">{t('navigation.home')}</a>
                    {links.map(([id, key, href]) =>
                        <a key={id} href={localePath(locale, href)}
                           className={active === id ? 'font-semibold text-blue-600' : 'hover:text-slate-950'}>{t(`navigation.${key}`)}</a>)}
                </nav>
            </div>
        </footer>
    </div>
}
