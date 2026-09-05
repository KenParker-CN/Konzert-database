'use client'

import { useCallback, useMemo, useState } from 'react'

/**
 * Unified multi-column sorting hook for all tables in the project.
 *
 * Features:
 * - Multi-column sorting: users can sort by multiple fields
 * - Later fields only compare when earlier fields are equal
 * - Default sort is separate from user sort
 * - Each table defines its own defaultSort
 * - Reset to default sort functionality
 */

export type SortDirection = 'asc' | 'desc'

export interface SortField<T = string> {
    key: T
    direction: SortDirection
}

export interface TableSortConfig<T extends string = string> {
    /** Default sort fields applied when table loads or when user resets */
    defaultSort: SortField<T>[]
    /** Optional: custom sort function for specific fields */
    customSorters?: Partial<Record<T, (a: unknown, b: unknown) => number>>
}

export interface TableSortResult<T, K extends string> {
    /** Current active sort fields (includes default + user modifications) */
    sortFields: SortField<K>[]
    /** Whether current sort differs from default */
    isCustomSort: boolean
    /** Toggle sort on a field (adds if not present, toggles direction if present) */
    toggleSort: (key: K) => void
    /** Set sort directly (replaces all sort fields) */
    setSort: (fields: SortField<K>[]) => void
    /** Reset to default sort */
    resetSort: () => void
    /** Sort data array */
    sortData: (data: T[]) => T[]
    /** Get sort state for a column header */
    getSortState: (key: K) => { active: boolean; direction: SortDirection | null; priority: number | null }
}

/**
 * Generic multi-column sort comparator
 */
function createMultiSortComparator<T, K extends string>(
    fields: SortField<K>[],
    accessor: (item: T, key: K) => string | number | null,
    customSorters?: Partial<Record<K, (a: T, b: T) => number>>,
): (a: T, b: T) => number {
    return (a: T, b: T): number => {
        for (const field of fields) {
            // Use custom sorter if available
            if (customSorters?.[field.key]) {
                const result = customSorters[field.key]!(a, b)
                if (result !== 0) {
                    return field.direction === 'asc' ? result : -result
                }
                continue
            }

            const aVal = accessor(a, field.key)
            const bVal = accessor(b, field.key)

            // Handle null/undefined - always sort to end regardless of direction
            if (aVal === null || aVal === undefined) {
                if (bVal === null || bVal === undefined) continue
                return 1
            }
            if (bVal === null || bVal === undefined) return -1

            // Compare values
            let result: number
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                result = aVal - bVal
            } else {
                result = String(aVal).localeCompare(String(bVal), undefined, {
                    numeric: true,
                    sensitivity: 'base',
                })
            }

            if (result !== 0) {
                return field.direction === 'asc' ? result : -result
            }
        }
        return 0
    }
}

/**
 * Hook for unified table sorting across the project.
 *
 * @param config - Sort configuration with default sort fields
 * @param accessor - Function to extract sort value from data item
 * @returns Sort state and helper functions
 */
export function useTableSort<T, K extends string>(
    config: TableSortConfig<K>,
    accessor: (item: T, key: K) => string | number | null = (item, key) => {
        const val = (item as Record<string, unknown>)[key]
        if (val === null || val === undefined) return null
        return val as string | number
    },
): TableSortResult<T, K> {
    const [userSortFields, setUserSortFields] = useState<SortField<K>[]>([])

    // Combined sort: user overrides take priority, then fall back to default
    const sortFields = useMemo(() => {
        if (userSortFields.length === 0) {
            return config.defaultSort
        }
        return userSortFields
    }, [userSortFields, config.defaultSort])

    const isCustomSort = userSortFields.length > 0

    const toggleSort = useCallback((key: K) => {
        setUserSortFields(current => {
            const existing = current.find(f => f.key === key)
            if (existing) {
                // Toggle direction
                if (existing.direction === 'asc') {
                    return current.map(f => f.key === key ? { ...f, direction: 'desc' as SortDirection } : f)
                } else {
                    // Remove from sort
                    return current.filter(f => f.key !== key)
                }
            } else {
                // Add to sort with asc direction (or desc for certain fields)
                return [...current, { key, direction: 'asc' as SortDirection }]
            }
        })
    }, [])

    const setSort = useCallback((fields: SortField<K>[]) => {
        setUserSortFields(fields)
    }, [])

    const resetSort = useCallback(() => {
        setUserSortFields([])
    }, [])

    const sortData = useCallback((data: T[]): T[] => {
        if (sortFields.length === 0) return data
        const comparator = createMultiSortComparator(sortFields, accessor, config.customSorters)
        return [...data].sort(comparator)
    }, [sortFields, accessor, config.customSorters])

    const getSortState = useCallback((key: K): { active: boolean; direction: SortDirection | null; priority: number | null } => {
        const index = sortFields.findIndex(f => f.key === key)
        if (index === -1) {
            return { active: false, direction: null, priority: null }
        }
        return {
            active: true,
            direction: sortFields[index].direction,
            priority: index + 1,
        }
    }, [sortFields])

    return {
        sortFields,
        isCustomSort,
        toggleSort,
        setSort,
        resetSort,
        sortData,
        getSortState,
    }
}

/**
 * Helper to create a simple single-column sort config
 */
export function createDefaultSort<K extends string>(key: K, direction: SortDirection = 'asc'): SortField<K>[] {
    return [{ key, direction }]
}

/**
 * Helper to create a multi-column default sort
 */
export function createMultiSort<K extends string>(...fields: Array<[K, SortDirection]>): SortField<K>[] {
    return fields.map(([key, direction]) => ({ key, direction }))
}
