import type {Metadata} from 'next'
import InstrumentDetailPage, {generateInstrumentMetadata} from '@/components/instruments/InstrumentDetailPage'
import {isLocale} from '@/lib/i18n/config'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({params}: {params: Promise<{locale: string; code: string}>}): Promise<Metadata> {
    const {locale, code} = await params
    if (!isLocale(locale)) notFound()
    return generateInstrumentMetadata(locale, code, `/${locale}/instruments/${code}`)
}

export default async function InstrumentPage({params}: {params: Promise<{locale: string; code: string}>}) {
    const {locale, code} = await params
    if (!isLocale(locale)) notFound()
    return <InstrumentDetailPage locale={locale} code={code}/>
}
