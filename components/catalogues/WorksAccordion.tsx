'use client'

import {useMemo, useState} from 'react'
import {Button} from '@/components/ui/button'
import WorksTable from '@/components/catalogues/WorksTable'
import {compareWorksBySort, type WorkCategoryGroup} from '@/lib/data/work-groups'
import {useI18n} from '@/lib/i18n/client'
import {Input} from '@/components/ui/input'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import {compareWorkKeys, normalizeWorkKey} from '@/lib/i18n/work-keys'
import {IconChevronDown, IconChevronRight, IconSearch, IconX} from '@tabler/icons-react'
import useAutoHideScrollbar from '@/components/hooks/useAutoHideScrollbar'

const PAGE_SIZE = 50

type ViewMode = 'groups' | 'all'

function normalizeSearchText(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim()
}

function flattenWorks(groups: WorkCategoryGroup[]): WorkCategoryGroup['works'] {
    return groups.flatMap(group => [...group.works, ...flattenWorks(group.children ?? [])])
}

function getGroupWorkCount(group: WorkCategoryGroup): number {
    return group.works.length + (group.children ?? []).reduce(
        (count, child) => count + getGroupWorkCount(child),
        0,
    )
}

function findGroupPath(groups: WorkCategoryGroup[], key: string, path: string[] = []): string[] | null {
    for (const group of groups) {
        const currentPath = [...path, group.key]
        if (group.key === key) return currentPath
        const childPath = findGroupPath(group.children ?? [], key, currentPath)
        if (childPath) return childPath
    }
    return null
}

function findFirstGroupWithWorks(groups: WorkCategoryGroup[]): WorkCategoryGroup | undefined {
    for (const group of groups) {
        if (group.works.length) return group
        const child = findFirstGroupWithWorks(group.children ?? [])
        if (child) return child
    }
    return groups[0]
}

/** 递归地按归一化调性过滤分组；仅保留含匹配作品的组。 */
function filterGroupsByKey(groups: WorkCategoryGroup[], normalizedKey: string): WorkCategoryGroup[] {
    const result: WorkCategoryGroup[] = []
    for (const group of groups) {
        const works = group.works.filter(work => normalizeWorkKey(work.key) === normalizedKey)
        const children = group.children ? filterGroupsByKey(group.children, normalizedKey) : []
        if (works.length === 0 && children.length === 0) continue
        const next: WorkCategoryGroup = {key: group.key, label: group.label, works}
        if (children.length) next.children = children
        result.push(next)
    }
    return result
}

export default function WorksAccordion({
    groups,
    catalogCode,
    otherTitle,
}: {
    groups: WorkCategoryGroup[]
    catalogCode: string
    otherTitle: string
}) {
    const {t, locale} = useI18n()
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [viewMode, setViewMode] = useState<ViewMode>('all')
    const [keyFilter, setKeyFilter] = useState('')
    const groupScrollbar = useAutoHideScrollbar()
    const initialGroup = findFirstGroupWithWorks(groups)
    const allWorks = useMemo(() => flattenWorks(groups), [groups])
    const sortedWorks = useMemo(() => [...allWorks].sort(compareWorksBySort), [allWorks])
    const [selectedKey, setSelectedKey] = useState(initialGroup?.key ?? '')
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
        const path = initialGroup ? findGroupPath(groups, initialGroup.key) : null
        return new Set(path?.slice(0, -1) ?? [])
    })

    // —— 调性筛选 ——
    const keyOptions = useMemo(() => {
        const keys = new Set<string>()
        for (const work of allWorks) {
            const normalized = normalizeWorkKey(work.key)
            if (normalized) keys.add(normalized)
        }
        return [...keys].sort((left, right) =>
            compareWorkKeys(left, right),
        )
    }, [allWorks])

    const filteredGroups = useMemo(
        () => (keyFilter ? filterGroupsByKey(groups, keyFilter) : groups),
        [groups, keyFilter],
    )
    const filteredWorks = useMemo(() => flattenWorks(filteredGroups), [filteredGroups])
    const filteredSortedWorks = useMemo(
        () => [...filteredWorks].sort(compareWorksBySort),
        [filteredWorks],
    )
    const selectedGroup = filteredGroups
        .flatMap(function flatten(group): WorkCategoryGroup[] {
            return [group, ...(group.children ?? []).flatMap(flatten)]
        })
        .find(group => group.key === selectedKey)
    const normalizedQuery = normalizeSearchText(query)
    const searchMatches = useMemo(() => {
        if (!normalizedQuery) return []
        const searchSource = viewMode === 'all' ? filteredSortedWorks : filteredWorks
        return searchSource.filter(work => {
            const searchableText = [
                work.sort,
                work.catalogue,
                work.opus,
                work.secondaryCatalogue,
                work.title,
                work.genre,
                work.key,
                ...Object.values(work.details),
            ].join(' ')
            return normalizeSearchText(searchableText).includes(normalizedQuery)
        })
    }, [filteredWorks, normalizedQuery, filteredSortedWorks, viewMode])
    const totalSearchPages = Math.ceil(searchMatches.length / PAGE_SIZE)
    const pagedSearchMatches = searchMatches.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE,
    )
    const totalAllPages = Math.ceil(filteredSortedWorks.length / PAGE_SIZE)
    const pagedAllWorks = filteredSortedWorks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    function renderPagination(currentPage: number, totalPages: number) {
        if (totalPages <= 1) return undefined
        return (
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    {t('works.pageInfo', {current: currentPage, total: totalPages})}
                </p>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(current => current - 1)}>
                        {t('common.previous')}
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(current => current + 1)}>
                        {t('common.next')}
                    </Button>
                </div>
            </div>
        )
    }

    function changeView(mode: ViewMode) {
        setViewMode(mode)
        setPage(1)
    }

    function changeKeyFilter(normalizedKey: string) {
        setKeyFilter(normalizedKey)
        setPage(1)
        setViewMode('all')
        // 切换调性后，重新定位到过滤后第一个含作品的组，避免停留在已失效的选中组。
        const filtered = normalizedKey ? filterGroupsByKey(groups, normalizedKey) : groups
        const first = findFirstGroupWithWorks(filtered)
        setSelectedKey(first?.key ?? '')
        setExpandedKeys(new Set(first ? (findGroupPath(filtered, first.key)?.slice(0, -1) ?? []) : []))
    }

    function selectGroup(group: WorkCategoryGroup) {
        setQuery('')
        setPage(1)
        setViewMode('groups')
        setSelectedKey(group.key)
        const path = findGroupPath(groups, group.key)
        if (path) {
            setExpandedKeys(current => new Set([...current, ...path]))
        }
    }

    function toggleExpanded(key: string) {
        const next = new Set(expandedKeys)
        if (next.has(key)) {
            next.delete(key)
            const selectedPath = findGroupPath(groups, selectedKey)
            if (selectedPath?.includes(key) && selectedKey !== key) setSelectedKey(key)
        } else {
            next.add(key)
        }
        setExpandedKeys(next)
    }

    function renderGroup(group: WorkCategoryGroup, depth = 0) {
        const children = group.children ?? []
        const isExpanded = expandedKeys.has(group.key)
        const isSelected = selectedKey === group.key
        const title = getLocalizedWorkTerm(group.key === 'other' ? otherTitle : group.label, 'type', locale)

        return (
            <li key={group.key} className="flex flex-col gap-1">
                <div className="flex min-w-0 items-center gap-1" style={{paddingInlineStart: `${depth * 0.75}rem`}}>
                    <Button
                        type="button"
                        variant={isSelected ? 'secondary' : 'ghost'}
                        size="sm"
                        className="min-w-0 flex-1 justify-start gap-2"
                        aria-current={isSelected ? 'page' : undefined}
                        title={title}
                        onClick={() => selectGroup(group)}
                    >
                        <span className="min-w-0 flex-1 truncate text-left">{title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{getGroupWorkCount(group)}</span>
                    </Button>
                    {children.length > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`${t(isExpanded ? 'common.close' : 'common.open')} ${title}`}
                            aria-expanded={isExpanded}
                            onClick={() => toggleExpanded(group.key)}
                        >
                            {isExpanded ? <IconChevronDown/> : <IconChevronRight/>}
                        </Button>
                    )}
                </div>
                {children.length > 0 && isExpanded && (
                    <ul className="flex flex-col gap-1">
                        {children.map(child => renderGroup(child, depth + 1))}
                    </ul>
                )}
            </li>
        )
    }

    return (
        <div className="flex min-w-0 flex-col gap-4">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                    <IconSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                        type="search"
                        value={query}
                        placeholder={t('works.searchPlaceholder')}
                        aria-label={t('works.searchPlaceholder')}
                        className="h-10 pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
                        onChange={event => {
                            setQuery(event.target.value)
                            setPage(1)
                        }}
                    />
                    {query && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2"
                            aria-label={t('common.clear')}
                            onClick={() => {
                                setQuery('')
                                setPage(1)
                            }}
                        >
                            <IconX/>
                        </Button>
                    )}
                </div>
                {keyOptions.length > 0 && (
                    <label className="flex shrink-0 items-center gap-2">
                        <span className="sr-only">{t('works.keyFilterLabel')}</span>
                        <select
                            value={keyFilter}
                            onChange={event => changeKeyFilter(event.target.value)}
                            aria-label={t('works.keyFilterLabel')}
                            className="h-10 rounded-lg border border-input bg-white px-3 pr-8 text-sm text-foreground shadow-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-slate-800"
                        >
                            <option value="">{t('works.allKeys')}</option>
                            {keyOptions.map(key => (
                                <option key={key} value={key}>
                                    {getLocalizedWorkTerm(key, 'key', locale)}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                <div className="flex shrink-0 gap-1 rounded-lg border border-slate-200 bg-white p-1">
                    <Button type="button" size="sm" variant={viewMode === 'groups' ? 'secondary' : 'ghost'} aria-pressed={viewMode === 'groups'} onClick={() => changeView('groups')}>
                        {t('works.groupedView')}
                    </Button>
                    <Button type="button" size="sm" variant={viewMode === 'all' ? 'secondary' : 'ghost'} aria-pressed={viewMode === 'all'} onClick={() => changeView('all')}>
                        {t('works.allView')}
                    </Button>
                </div>
            </div>
            <div className={`grid min-w-0 grid-cols-1 gap-4 md:items-stretch ${viewMode === 'groups' ? 'md:grid-cols-[minmax(12rem,3fr)_minmax(0,7fr)]' : ''}`}>
                {viewMode === 'groups' && (
                    <nav
                        aria-label={t('works.groupNavigation')}
                        className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex md:h-[max(18rem,min(40rem,calc(100dvh-19rem)))] md:flex-col"
                    >
                        <ul className={`${groupScrollbar.className} flex max-h-60 flex-col gap-1 overflow-y-auto md:min-h-0 md:max-h-none md:flex-1`} onScroll={groupScrollbar.onScroll}>
                            {filteredGroups.map(group => renderGroup(group))}
                        </ul>
                    </nav>
                )}
                {normalizedQuery ? (
                    <div className="flex min-w-0 flex-col gap-3">
                        {pagedSearchMatches.length > 0 ? (
                            <WorksTable
                                key={`search-${normalizedQuery}-${page}`}
                                group={{
                                    key: 'work-search-results',
                                    label: t('works.searchResults'),
                                    works: pagedSearchMatches,
                                }}
                                catalogCode={catalogCode}
                                onSelectGroup={selectGroup}
                                otherTitle={otherTitle}
                                countOverride={searchMatches.length}
                                footer={renderPagination(page, totalSearchPages)}
                            />
                        ) : (
                            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
                                {t('works.noSearchResults')}
                            </div>
                        )}
                    </div>
                ) : viewMode === 'all' ? (
                    <WorksTable
                        key={`all-${page}-${keyFilter}`}
                        group={{key: 'all-works', label: t('works.allWorks'), works: pagedAllWorks}}
                        catalogCode={catalogCode}
                        onSelectGroup={selectGroup}
                        otherTitle={otherTitle}
                        countOverride={filteredSortedWorks.length}
                        footer={renderPagination(page, totalAllPages)}
                    />
                ) : selectedGroup ? (
                    <WorksTable
                        group={selectedGroup}
                        catalogCode={catalogCode}
                        onSelectGroup={selectGroup}
                        otherTitle={otherTitle}
                    />
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
                        {t('works.noWorks')}
                    </div>
                )}
            </div>
        </div>
    )
}
