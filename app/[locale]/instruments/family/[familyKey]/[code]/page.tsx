import type {Metadata} from 'next'
import InstrumentDetailPage, {generateInstrumentMetadata} from '@/components/instruments/InstrumentDetailPage'
import {isLocale} from '@/lib/i18n/config'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function generateMetadata({params}: {params: Promise<{locale: string; familyKey: string; code: string}>}): Promise<Metadata> {
    const {locale, familyKey, code} = await params
    if (!isLocale(locale)) notFound()
    return generateInstrumentMetadata(locale, code, `/${locale}/instruments/family/${familyKey}/${code}`)
}

export default async function FamilyInstrumentPage({params}: {params: Promise<{locale: string; familyKey: string; code: string}>}) {
    const {locale, familyKey, code} = await params
    if (!isLocale(locale)) notFound()
    return <InstrumentDetailPage locale={locale} code={code} familyKey={familyKey}/>
}
