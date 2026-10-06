import AppShell from '../../components/AppShell'
import {isLocale, localePath} from '@/lib/i18n/config'
import {getI18n} from '@/lib/i18n/server'
import {notFound} from 'next/navigation'
import { BlurInText } from "@/components/ui/blur-in-text";
export default async function HomePage({params}: { params: Promise<{ locale: string }> }) {
    const {locale} = await params
    if (!isLocale(locale)) notFound()
    const {t} = await getI18n(locale)
    return <AppShell>
        <main className="min-h-screen">
            <section className="mx-auto max-w-6xl px-5 pb-20 pt-20 lg:px-8 lg:pt-28">
                <div className="max-w-3xl"><p
                    className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">{t('home.badge')}</p>
                    <BlurInText
                        className="text-4xl font-bold -tracking-widest text-slate-950 md:text-7xl"
                        text="Parker's"
                    />
                    <p className="mt-5 max-w-xl text-xl leading-8 text-slate-600">{t('home.tagline')}</p><a
                        href={localePath(locale, '/composers')}
                        className="mt-8 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">{t('home.exploreComposers')}</a>
                </div>
                <div className="mt-20 grid gap-4 sm:grid-cols-1"><a href={localePath(locale, '/composers')}
                                                                     className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md"><span
                    className="text-sm font-semibold text-blue-600">01</span><h2
                    className="heading mt-8 text-xl font-semibold">{t('home.composersDirectoryTitle')}</h2><p
                    className="mt-2 text-sm leading-6 text-slate-600">{t('home.composersDirectoryDescription')}</p></a></div>
            </section>
        </main>
    </AppShell>
}
