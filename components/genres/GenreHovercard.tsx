'use client'

import type {ReactNode} from 'react'
import {PreviewCard} from '@base-ui/react/preview-card'
import {useGenreTermLocalizer} from '@/components/genres/GenreLinkProvider'
import type {Locale} from '@/lib/i18n/config'
import GenreIntroduction from './GenreIntroduction'

export default function GenreHovercard({
    genreTerm,
    genreWikiID,
    locale,
    children,
}: {
    genreTerm: string
    genreWikiID?: string
    locale: Locale
    children: ReactNode
}) {
    const localizeGenre = useGenreTermLocalizer(locale)
    return (
        <PreviewCard.Root>
            <PreviewCard.Trigger render={<span className="inline-flex"/>} delay={200} closeDelay={150}>
                {children}
            </PreviewCard.Trigger>
            <PreviewCard.Portal>
                <PreviewCard.Positioner sideOffset={6} className="z-[100]">
                    <PreviewCard.Popup className="w-72 max-w-72 origin-top rounded-lg border border-slate-200 bg-white p-3 text-left shadow-xl outline-none transition duration-200 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
                        <div className="mb-1.5 text-sm font-semibold text-slate-900">
                            {localizeGenre(genreTerm)}
                        </div>
                        <GenreIntroduction wikiID={genreWikiID} locale={locale} variant="dialog"/>
                    </PreviewCard.Popup>
                </PreviewCard.Positioner>
            </PreviewCard.Portal>
        </PreviewCard.Root>
    )
}
