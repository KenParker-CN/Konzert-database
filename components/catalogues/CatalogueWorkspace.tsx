'use client'

import {useMemo, type ReactNode} from 'react'
import AlphabetIndex, {type AlphabetIndexItem} from '@/components/AlphabetIndex'
import type {getCatalogueDirectory} from '@/lib/db/composers'
import {localePath, type Locale} from '@/lib/i18n/config'

type CatalogueEntry = Awaited<ReturnType<typeof getCatalogueDirectory>>[number]

export default function CatalogueWorkspace({
    catalogues,
    currentCatalogue,
    locale,
    children,
}: {
    catalogues: CatalogueEntry[]
    currentCatalogue: string
    locale: Locale
    children: ReactNode
}) {
    const items = useMemo<AlphabetIndexItem[]>(() => catalogues.map(entry => {
        const name = entry.composerNameSort || entry.composerName
        return {
            key: entry.catalogue,
            sortName: name,
            label: name,
            href: localePath(locale, `/catalogues/${entry.catalogue}`),
        }
    }), [catalogues, locale])

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <AlphabetIndex items={items} activeKey={currentCatalogue} variant="side"/>
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    )
}
