import GenreWorkspace from '@/components/genres/GenreWorkspace'
import GenreIntroduction from '@/components/genres/GenreIntroduction'
import GenreRelatedWorks from '@/components/genres/GenreRelatedWorks'
import {getGenreBySlug, getGenreTermsBySlug} from '@/lib/data/genres'
import {getGenreWorksSafe} from '@/lib/db/composers'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import {getI18n} from '@/lib/i18n/server'
import {isLocale} from '@/lib/i18n/config'
import {notFound} from 'next/navigation'

export default async function GenrePage({params}: {params: Promise<{locale: string; slug: string}>}) {
    const {locale, slug} = await params
    if (!isLocale(locale)) notFound()
    const genre = getGenreBySlug(slug)
    if (!genre) notFound()
    const {t} = await getI18n(locale)
    const title = getLocalizedWorkTerm(genre.term, 'type', locale)
    const {groups: relatedWorkGroups} = await getGenreWorksSafe(getGenreTermsBySlug(genre.slug), locale)

    return (
        <GenreWorkspace locale={locale} currentSlug={genre.slug}>
            <main className="min-h-[calc(100dvh-4rem)]">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <article className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h1 className="heading text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
                        <GenreIntroduction
                            wikiID={genre.wikiID}
                            locale={locale}
                        />
                    </article>
                    <GenreRelatedWorks groups={relatedWorkGroups}/>
                </div>
            </main>
        </GenreWorkspace>
    )
}
