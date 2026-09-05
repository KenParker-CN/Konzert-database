'use client'

import { ChevronDown, ChevronUp, ChevronsUpDown, RotateCcw } from 'lucide-react'
import type { SortDirection } from '@/lib/hooks/useTableSort'

/**
 * Props for the sortable table header component
 */
export interface SortableHeaderProps {
    /** Column label */
    label: string
    /** Whether this column is currently being sorted */
    active: boolean
    /** Current sort direction */
    direction: SortDirection | null
    /** Sort priority (1-based, shown when multiple columns are sorted) */
    priority: number | null
    /** Callback when header is clicked */
    onToggle: () => void
    /** Whether to show a reset button (only on the first sorted column) */
    showReset?: boolean
    /** Callback to reset sort */
    onReset?: () => void
    /** Additional CSS classes */
    className?: string
}

/**
 * Unified sortable table header button used across all tables.
 * Shows sort direction indicator and priority number for multi-column sort.
 */
export function SortableTableHeader({
    label,
    active,
    direction,
    priority,
    onToggle,
    showReset = false,
    onReset,
    className = '',
}: SortableHeaderProps) {
    const getIcon = () => {
        if (!active || !direction) {
            return <ChevronsUpDown size={12} className="text-slate-300" aria-hidden="true" />
        }
        return direction === 'asc'
            ? <ChevronUp size={12} className="text-blue-600" aria-hidden="true" />
            : <ChevronDown size={12} className="text-blue-600" aria-hidden="true" />
    }

    return (
        <div className={`inline-flex items-center gap-1 ${className}`}>
            <button
                type="button"
                onClick={onToggle}
                className={`inline-flex items-center gap-1 text-xs uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                    active ? 'text-blue-700 font-semibold' : 'text-slate-500 hover:text-blue-700'
                }`}
                aria-label={active && direction
                    ? `Sorted ${direction === 'asc' ? 'ascending' : 'descending'} by ${label}. Click to ${direction === 'asc' ? 'sort descending' : 'remove sort'}.`
                    : `Sort by ${label}`
                }
            >
                {label}
                <span className="relative">
                    {getIcon()}
                    {active && priority !== null && priority > 1 && (
                        <span className="absolute -top-1 -right-2 flex h-3 w-3 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white">
                            {priority}
                        </span>
                    )}
                </span>
            </button>
            {showReset && active && onReset && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onReset()
                    }}
                    className="ml-1 text-slate-400 hover:text-blue-600 focus:outline-none"
                    aria-label="Reset to default sort"
                    title="Reset to default sort"
                >
                    <RotateCcw size={10} />
                </button>
            )}
        </div>
    )
}

/**
 * Simple sortable header for basic use cases
 */
export interface SimpleSortHeaderProps {
    label: string
    active: boolean
    direction: SortDirection | null
    onToggle: () => void
    className?: string
}

export function SimpleSortHeader({ label, active, direction, onToggle, className = '' }: SimpleSortHeaderProps) {
    const getIcon = () => {
        if (!active || !direction) {
            return <ChevronsUpDown size={12} className="text-slate-300" aria-hidden="true" />
        }
        return direction === 'asc'
            ? <ChevronUp size={12} className="text-blue-600" aria-hidden="true" />
            : <ChevronDown size={12} className="text-blue-600" aria-hidden="true" />
    }

    return (
        <button
            type="button"
            onClick={onToggle}
            className={`inline-flex items-center gap-1 text-xs uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${className} ${
                active ? 'text-blue-700 font-semibold' : 'text-slate-500 hover:text-blue-700'
            }`}
        >
            {label}
            {getIcon()}
        </button>
    )
}
