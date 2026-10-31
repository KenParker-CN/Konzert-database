import InstrumentWorkspace from '@/components/instruments/InstrumentWorkspace'
import GenreIntroduction from '@/components/genres/GenreIntroduction'
import GenreRelatedWorks from '@/components/genres/GenreRelatedWorks'
import {getInstrumentFamilies, getInstrumentRef, getInstrumentRelatedWorkGroups} from '@/lib/db/instruments'
import {isLocale} from '@/lib/i18n/config'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function InstrumentPage({params}: {params: Promise<{locale: string; code: string}>}) {
    const {locale, code} = await params
    if (!isLocale(locale)) notFound()

    const ref = getInstrumentRef(code)
    if (!ref) notFound()

    const [families, relatedWorkGroups] = await Promise.all([
        getInstrumentFamilies(locale),
        getInstrumentRelatedWorkGroups(ref.item.abbrev, locale),
    ])

    return (
        <InstrumentWorkspace locale={locale} families={families} currentAbbrev={ref.item.abbrev}>
            <main className="min-h-[calc(100dvh-4rem)]">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <article className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{ref.group[locale]}</p>
                        <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{ref.item[locale]}</h1>
                        <GenreIntroduction wikiID={ref.wikiID} locale={locale}/>
                    </article>
                    <GenreRelatedWorks groups={relatedWorkGroups}/>
                </div>
            </main>
        </InstrumentWorkspace>
    )
}
