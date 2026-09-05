import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n/config'

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

    return <>{children}</>
}