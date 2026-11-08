'use client'

import {useCallback, useEffect, useLayoutEffect, useRef} from 'react'
import {useI18n} from '@/lib/i18n/client'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import type {ComposerWork} from '@/lib/db/composers'
import type {ReactNode} from 'react'
import Link from 'next/link'
import {localePath} from '@/lib/i18n/config'
import WorkDetailsDialog from '@/components/catalogues/WorkDetailsDialog'
import {useGenreTermLocalizer} from '@/components/genres/GenreLinkProvider'

export default function WorksTable({
    works,
    catalogCode,
    showDateColumn = false,
    footer,
}: {
    works: ComposerWork[]
    catalogCode?: string
    showDateColumn?: boolean
    footer?: ReactNode
}) {
    const {t, locale} = useI18n()
    const localizeGenre = useGenreTermLocalizer(locale)
    const listRef = useRef<HTMLDivElement>(null)

    const updateScrollFade = useCallback(() => {
        const el = listRef.current
        if (!el) return
        const canScroll = el.scrollHeight - el.clientHeight > 1
        el.style.setProperty('--fade-top', canScroll && el.scrollTop > 1 ? '24px' : '0px')
        el.style.setProperty('--fade-bottom', canScroll && el.scrollTop + el.clientHeight < el.scrollHeight - 1 ? '24px' : '0px')
    }, [])

    useEffect(() => {
        updateScrollFade()
        window.addEventListener('resize', updateScrollFade)
        return () => window.removeEventListener('resize', updateScrollFade)
    }, [works, updateScrollFade])

    return (
        <>
        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:min-h-72 md:flex-1">
            <div className="flex shrink-0 items-center divide-x divide-slate-200 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="w-24 shrink-0 px-1.5 text-center">{showDateColumn ? t('works.date') : t('works.catalogue')}</span>
                <span className="w-72 shrink-0 px-1.5 text-center">{t('works.titleColumn')}</span>
                <span className="hidden w-28 shrink-0 px-1.5 text-center sm:block">{t('works.genre')}</span>
                <span className="hidden w-28 shrink-0 px-1.5 text-center md:block">{t('works.key')}</span>
                <span className="hidden min-w-0 flex-1 px-1.5 text-center lg:block">{t('works.instrumentation')}</span>
            </div>
            <div ref={listRef} onScroll={updateScrollFade} className="scroll-fade-y always-visible-scrollbar max-h-112 overflow-y-auto md:min-h-0 md:max-h-none md:flex-1">
                {works.map(work => (
                    <div
                        key={work.workId}
                        className="relative flex w-full items-center divide-x divide-slate-200 border-b border-slate-100 px-4 py-1.5 transition-colors last:border-0 hover:bg-blue-50/50"
                    >
                        <FitText className="w-24 shrink-0 px-1.5 text-center font-semibold text-blue-700">{work.catalogue || work.opus || work.date}</FitText>
                        {work.details['WikiQID'] ? (
                            <Link
                                href={localePath(locale, `/works/${work.details['WikiQID']}`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`relative z-10 w-72 shrink-0 truncate px-1.5 text-sm font-medium text-blue-700 underline underline-offset-4 hover:text-blue-900 ${work.title ? '' : 'italic'}`}
                            >
                                {work.title || work.details['Subtitle']}
                            </Link>
                        ) : (
                            <span className={`w-72 shrink-0 truncate px-1.5 text-sm text-slate-900 ${work.title ? '' : 'italic'}`}>{work.title || work.details['Subtitle']}</span>
                        )}
                        <span className="hidden w-28 shrink-0 justify-center px-1.5 sm:flex">
                            {work.genre && (
                                <span className="max-w-full truncate rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                    {localizeGenre(work.genre)}
                                </span>
                            )}
                        </span>
                        <span className="hidden w-28 shrink-0 justify-center px-1.5 md:flex">
                            {work.key && (
                                <span className="max-w-full truncate rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                    {getLocalizedWorkTerm(work.key, 'key', locale)}
                                </span>
                            )}
                        </span>
                        <span className="hidden min-w-0 flex-1 line-clamp-2 px-1.5 text-left text-xs text-slate-500 lg:block">{work.instrumentation && getLocalizedWorkTerm(work.instrumentation, 'instrumentation', locale)}</span>
                        <WorkDetailsDialog
                            work={work}
                            catalogCode={catalogCode}
                            triggerClassName="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                        >
                            {null}
                        </WorkDetailsDialog>
                    </div>
                ))}
            </div>
        </section>
        {footer && <div className="flex shrink-0 justify-center">{footer}</div>}
        </>
    )
}

const MIN_FIT_FONT_SIZE = 10

function FitText({className, children}: {className: string; children: ReactNode}) {
    const ref = useRef<HTMLSpanElement>(null)

    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        const fit = () => {
            el.style.fontSize = ''
            let size = parseFloat(getComputedStyle(el).fontSize)
            while (el.scrollWidth > el.clientWidth && size > MIN_FIT_FONT_SIZE) {
                size -= 0.5
                el.style.fontSize = `${size}px`
            }
        }
        fit()
        const observer = new ResizeObserver(fit)
        observer.observe(el)
        return () => observer.disconnect()
    }, [children])

    return <span ref={ref} className={`${className} overflow-hidden whitespace-nowrap`}>{children}</span>
}
