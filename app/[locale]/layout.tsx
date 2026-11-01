import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n/config'
import { GenreLinkProvider } from '@/components/genres/GenreLinkProvider'
import { getGenreLinks } from '@/lib/data/genre-links'

type Props = {
    children: ReactNode
    params: Promise<{
        locale: string
    }>
}

export default async function LocaleLayout({
                                               children,
                                               params,
                                           }: Props) {
    const { locale } = await params

    if (!isLocale(locale)) {
        notFound()
    }

    const genreLinks = await getGenreLinks()

    return <GenreLinkProvider value={genreLinks}>{children}</GenreLinkProvider>
}
