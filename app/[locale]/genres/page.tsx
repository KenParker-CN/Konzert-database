import GenreWorkspace from '@/components/genres/GenreWorkspace'
import {genreCategories} from '@/lib/data/genres'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import {getI18n} from '@/lib/i18n/server'
import {isLocale, localePath} from '@/lib/i18n/config'
import {IconArrowUpRight} from '@tabler/icons-react'
import Link from 'next/link'
import {notFound} from 'next/navigation'

export default async function GenresPage({params}: {params: Promise<{locale: string}>}) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()
    const {t} = await getI18n(locale)

    return (
        <GenreWorkspace locale={locale}>
            <main className="min-h-full">
                <div className="mx-auto max-w-300 px-5 py-8 lg:px-10 lg:py-10">
                    <header className="mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{t('navigation.genres')}</p>
                        <h1 className="heading mt-2 text-3xl font-semibold tracking-tight text-slate-950">{t('genrePages.title')}</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{t('genrePages.description')}</p>
                    </header>
                    <div className="space-y-8">
                        {genreCategories.map(category => (
                            <section key={category.id}>
                                <h2 className="heading mb-3 text-lg font-semibold text-slate-900">{t(`genrePages.${category.id}`)}</h2>
                                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {category.genres.map(genre => (
                                        <li key={genre.slug}>
                                            <Link
                                                href={localePath(locale, `/genres/${genre.slug}`)}
                                                className="group flex min-h-20 items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                            >
                                                <span className="heading text-base font-semibold text-slate-900">{getLocalizedWorkTerm(genre.term, 'type', locale)}</span>
                                                <IconArrowUpRight size={18} className="shrink-0 text-slate-400 transition group-hover:text-blue-600" aria-hidden="true"/>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                </div>
            </main>
        </GenreWorkspace>
    )
}
