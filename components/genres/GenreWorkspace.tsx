'use client'

import {useEffect, useRef, useState, type ReactNode} from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import useAutoHideScrollbar from '@/components/hooks/useAutoHideScrollbar'
import {genreCategories, type GenreNavNode} from '@/lib/data/genres'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import {useI18n} from '@/lib/i18n/client'
import {localePath, type Locale} from '@/lib/i18n/config'
import {IconChevronDown, IconMasksTheater, IconMicrophone2, IconPiano} from '@tabler/icons-react'

function getBranchIds(nodes: readonly GenreNavNode[]): string[] {
    return nodes.flatMap(node => node.children?.length
        ? [node.id, ...getBranchIds(node.children)]
        : [])
}

function findGenrePaths(nodes: readonly GenreNavNode[], slug: string, path: string[] = []): string[][] {
    const paths: string[][] = []
    for (const node of nodes) {
        const nextPath = [...path, node.id]
        if (node.genre?.slug === slug) paths.push(node.children?.length ? nextPath : nextPath.slice(0, -1))
        paths.push(...findGenrePaths(node.children ?? [], slug, nextPath))
    }
    return paths
}

function getCollapsedIds(currentSlug?: string): Set<string> {
    const expandedIds = new Set(currentSlug ? findGenrePaths(genreCategories, currentSlug).flat() : [])
    return new Set(getBranchIds(genreCategories).filter(id => !expandedIds.has(id)))
}

export default function GenreWorkspace({
    locale,
    currentSlug,
    children,
}: {
    locale: Locale
    currentSlug?: string
    children: ReactNode
}) {
    const {t} = useI18n()
    const navRef = useRef<HTMLElement>(null)
    const scrollStorageKey = `genre-navigation-scroll:${locale}`
    const scrollbar = useAutoHideScrollbar()
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(() => getCollapsedIds(currentSlug))

    useEffect(() => {
        setCollapsedNodes(getCollapsedIds(currentSlug))
    }, [currentSlug])

    useEffect(() => {
        const savedScrollTop = Number(sessionStorage.getItem(scrollStorageKey))
        if (Number.isFinite(savedScrollTop) && navRef.current) {
            navRef.current.scrollTop = savedScrollTop
        }
    }, [scrollStorageKey])

    function renderNodes(nodes: readonly GenreNavNode[], depth: number): ReactNode {
        return nodes.map(node => {
            const hasChildren = Boolean(node.children?.length)
            const collapsed = collapsedNodes.has(node.id)
            const label = node.genre
                ? getLocalizedWorkTerm(node.genre.term, 'type', locale)
                : node.labelKey ? t(node.labelKey) : node.id

            if (node.genre && !hasChildren) {
                return (
                    <li key={node.id}>
                        <Link
                            href={localePath(locale, `/genres/${node.genre.slug}`)}
                            aria-current={currentSlug === node.genre.slug ? 'page' : undefined}
                            className={`block rounded-md px-2.5 py-2 text-sm font-medium leading-5 transition-colors ${currentSlug === node.genre.slug ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'}`}
                        >
                            <span className="block truncate">{getLocalizedWorkTerm(node.genre.term, 'type', locale)}</span>
                        </Link>
                    </li>
                )
            }

            const Icon = depth === 0
                ? node.id === 'vocal' ? IconMicrophone2 : node.id === 'stage' ? IconMasksTheater : IconPiano
                : null
            const childListId = `genre-node-${node.id}`

            return (
                <li key={node.id}>
                    <div className={depth === 0
                        ? 'mb-1 flex w-full items-center gap-1 rounded-sm border-l-2 border-blue-600 bg-slate-100 pr-1 text-left transition-colors hover:bg-slate-200'
                        : `flex w-full items-center gap-1 rounded-md pr-1 text-left transition-colors hover:bg-slate-100 ${node.genre && currentSlug === node.genre.slug ? 'bg-blue-50' : ''}`}>
                        {node.genre ? (
                            <Link
                                href={localePath(locale, `/genres/${node.genre.slug}`)}
                                aria-current={currentSlug === node.genre.slug ? 'page' : undefined}
                                className={`flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 ${currentSlug === node.genre.slug ? 'font-semibold text-blue-700' : 'font-medium text-slate-700'}`}
                            >
                                {Icon && <Icon className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true"/>}
                                <span className={`block min-w-0 flex-1 truncate ${depth === 0 ? 'text-xs font-bold uppercase tracking-[0.12em]' : depth === 1 ? node.genre ? 'text-sm font-medium' : 'text-xs font-semibold' : 'text-sm'}`}>
                                    {label}
                                </span>
                            </Link>
                        ) : (
                            <button
                                type="button"
                                aria-expanded={!collapsed}
                                aria-controls={childListId}
                                onClick={() => setCollapsedNodes(current => {
                                    const next = new Set(current)
                                    if (next.has(node.id)) next.delete(node.id)
                                    else next.add(node.id)
                                    return next
                                })}
                                className={`flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 ${depth === 0 ? 'text-xs font-bold uppercase tracking-[0.12em] text-slate-700' : depth === 1 ? 'text-xs font-semibold text-slate-600' : 'text-sm font-medium text-slate-700'}`}
                            >
                                {Icon && <Icon className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true"/>}
                                <span className="min-w-0 flex-1 truncate">{label}</span>
                            </button>
                        )}
                        {hasChildren && (
                            <button
                                type="button"
                                aria-label={`${t(collapsed ? 'common.open' : 'common.close')} ${label}`}
                                aria-expanded={!collapsed}
                                aria-controls={childListId}
                                onClick={() => setCollapsedNodes(current => {
                                    const next = new Set(current)
                                    if (next.has(node.id)) next.delete(node.id)
                                    else next.add(node.id)
                                    return next
                                })}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-200"
                            >
                                <IconChevronDown className={`h-4 w-4 transition-transform ${collapsed ? '-rotate-90' : ''}`} aria-hidden="true"/>
                            </button>
                        )}
                    </div>
                    {hasChildren && (
                        <ul
                            id={childListId}
                            className={`flex flex-col gap-1 ${depth === 0 ? 'pl-3' : 'ml-3 border-l border-slate-200 pl-2'} ${collapsed ? 'hidden' : ''}`}
                        >
                            {renderNodes(node.children ?? [], depth + 1)}
                        </ul>
                    )}
                </li>
            )
        })
    }

    return (
        <AppShell active="genres">
            <div className="mx-auto flex h-[calc(100dvh-4rem)] min-h-0 max-w-360 flex-col md:flex-row">
                <aside className="flex h-56 min-h-0 shrink-0 flex-col border-b border-slate-200 bg-white md:h-full md:w-72 md:border-b-0 md:border-r">
                    <div className="flex h-12 shrink-0 items-center px-3">
                        <h2 className="truncate text-sm font-semibold text-slate-800">{t('genrePages.title')}</h2>
                    </div>
                    <nav
                        ref={navRef}
                        aria-label={t('genrePages.title')}
                        className={`${scrollbar.className} min-h-0 flex-1 overflow-y-auto px-2 pb-3`}
                        onScroll={event => {
                            scrollbar.onScroll()
                            sessionStorage.setItem(scrollStorageKey, String(event.currentTarget.scrollTop))
                        }}
                    >
                        <ul className="flex flex-col gap-1">
                            {renderNodes(genreCategories, 0)}
                        </ul>
                    </nav>
                </aside>
                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
            </div>
        </AppShell>
    )
}
