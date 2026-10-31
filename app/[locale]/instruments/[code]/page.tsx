import AppShell from '@/components/AppShell'
import GenreIntroduction from '@/components/genres/GenreIntroduction'
import GenreRelatedWorks from '@/components/genres/GenreRelatedWorks'
import {getInstrumentRef, getInstrumentRelatedWorkGroups} from '@/lib/db/instruments'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {IconChevronRight} from '@tabler/icons-react'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function InstrumentPage({params}: {params: Promise<{locale: string; code: string}>}) {
    const {locale, code} = await params
    if (!isLocale(locale)) notFound()

    const ref = getInstrumentRef(code)
    if (!ref) notFound()

    const [{t}, relatedWorkGroups] = await Promise.all([
        getI18n(locale),
        getInstrumentRelatedWorkGroups(ref.item.abbrev, locale),
    ])

    return (
        <AppShell active="instruments">
            <main className="min-h-[calc(100dvh-4rem)]">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <nav aria-label="Breadcrumb" className="mb-4">
                        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
                            <li>
                                <Link href={localePath(locale, '/instruments')} className="font-medium text-blue-600 hover:underline">
                                    {t('navigation.instruments')}
                                </Link>
                            </li>
                            <li aria-hidden="true"><IconChevronRight size={14} className="text-slate-400"/></li>
                            <li className="font-medium text-slate-700">{ref.group[locale]}</li>
                            <li aria-hidden="true"><IconChevronRight size={14} className="text-slate-400"/></li>
                            <li className="font-semibold text-slate-900" aria-current="page">{ref.item[locale]}</li>
                        </ol>
                    </nav>
                    <article className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h1 className="heading text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{ref.item[locale]}</h1>
                        <GenreIntroduction wikiID={ref.wikiID} locale={locale}/>
                    </article>
                    <GenreRelatedWorks groups={relatedWorkGroups}/>
                </div>
            </main>
        </AppShell>
    )
}
