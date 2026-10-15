'use client'

import {useMemo, useState} from 'react'
import {Button} from '@/components/ui/button'
import WorksTable from '@/components/catalogues/WorksTable'
import type {WorkCategoryGroup} from '@/lib/data/work-groups'
import {useI18n} from '@/lib/i18n/client'
import {Input} from '@/components/ui/input'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'
import {IconChevronDown, IconChevronRight, IconSearch, IconX} from '@tabler/icons-react'

const SEARCH_PAGE_SIZE = 50

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
    const [searchPage, setSearchPage] = useState(1)
    const initialGroup = findFirstGroupWithWorks(groups)
    const allWorks = useMemo(() => flattenWorks(groups), [groups])
    const [selectedKey, setSelectedKey] = useState(initialGroup?.key ?? '')
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
        const path = initialGroup ? findGroupPath(groups, initialGroup.key) : null
        return new Set(path?.slice(0, -1) ?? [])
    })
    const selectedGroup = groups
        .flatMap(function flatten(group): WorkCategoryGroup[] {
            return [group, ...(group.children ?? []).flatMap(flatten)]
        })
        .find(group => group.key === selectedKey)
    const normalizedQuery = normalizeSearchText(query)
    const searchMatches = useMemo(() => {
        if (!normalizedQuery) return []
        return allWorks.filter(work => {
            const searchableText = [
                work.catalogue,
                work.opus,
                work.secondaryCatalogue,
                work.title,
                work.type,
                work.key,
                ...Object.values(work.details),
            ].join(' ')
            return normalizeSearchText(searchableText).includes(normalizedQuery)
        })
    }, [allWorks, normalizedQuery])
    const totalSearchPages = Math.ceil(searchMatches.length / SEARCH_PAGE_SIZE)
    const pagedSearchMatches = searchMatches.slice(
        (searchPage - 1) * SEARCH_PAGE_SIZE,
        searchPage * SEARCH_PAGE_SIZE,
    )

    function selectGroup(group: WorkCategoryGroup) {
        setQuery('')
        setSearchPage(1)
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
            <div className="relative min-w-0">
                <IconSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <Input
                    type="search"
                    value={query}
                    placeholder={t('works.searchPlaceholder')}
                    aria-label={t('works.searchPlaceholder')}
                    className="h-10 pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
                    onChange={event => {
                        setQuery(event.target.value)
                        setSearchPage(1)
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
                            setSearchPage(1)
                        }}
                    >
                        <IconX/>
                    </Button>
                )}
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(12rem,3fr)_minmax(0,7fr)]">
                <nav
                    aria-label={t('works.groupNavigation')}
                    className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                    <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto md:max-h-144">
                        {groups.map(group => renderGroup(group))}
                    </ul>
                </nav>
                {normalizedQuery ? (
                    <div className="flex min-w-0 flex-col gap-3">
                        {pagedSearchMatches.length > 0 ? (
                            <WorksTable
                                group={{
                                    key: 'work-search-results',
                                    label: t('works.searchResults'),
                                    works: pagedSearchMatches,
                                }}
                                catalogCode={catalogCode}
                                onSelectGroup={selectGroup}
                                otherTitle={otherTitle}
                                countOverride={searchMatches.length}
                            />
                        ) : (
                            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
                                {t('works.noSearchResults')}
                            </div>
                        )}
                        {totalSearchPages > 1 && (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-sm text-muted-foreground">
                                    {t('works.pageInfo', {current: searchPage, total: totalSearchPages})}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={searchPage <= 1}
                                        onClick={() => setSearchPage(page => page - 1)}
                                    >
                                        {t('common.previous')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={searchPage >= totalSearchPages}
                                        onClick={() => setSearchPage(page => page + 1)}
                                    >
                                        {t('common.next')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
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
