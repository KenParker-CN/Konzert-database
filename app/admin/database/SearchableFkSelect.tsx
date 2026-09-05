'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Plus, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import CreateRowDialog from './CreateRowDialog'

type FkOption = { value: string; label: string }

type SearchableFkSelectProps = {
    value: string
    onChange: (value: string) => void
    options: FkOption[]
    label: string
    placeholder: string
    columnName: string
    inputClass: string
    targetTable?: string
    allowCreate?: boolean
    onOptionCreated?: (option: FkOption) => void
}

export default function SearchableFkSelect({
    value,
    onChange,
    options,
    label,
    placeholder,
    columnName,
    inputClass,
    targetTable,
    allowCreate,
    onOptionCreated,
}: SearchableFkSelectProps) {
    const [searchText, setSearchText] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [highlightIndex, setHighlightIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)

    const selectedOption = useMemo(
        () => options.find(o => o.value === value),
        [options, value],
    )

    // When dropdown is open and user is typing, show their input.
    // Otherwise always derive from the value prop so it stays in sync
    // even if the parent re-renders between local state updates.
    const displayText = isOpen && searchText !== '' ? searchText : (selectedOption?.label ?? '')

    const filteredOptions = useMemo(() => {
        if (!searchText.trim()) return options
        const lower = searchText.toLowerCase()
        return options.filter(o => o.label.toLowerCase().includes(lower))
    }, [options, searchText])

    const exactMatch = useMemo(() => {
        if (!searchText.trim()) return false
        const lower = searchText.toLowerCase()
        return options.some(o => o.label.toLowerCase() === lower)
    }, [options, searchText])

    const showCreateOption = !!allowCreate && searchText.trim().length > 0 && !exactMatch

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
                setDropdownPos(null)
            }
        }
        function handleScroll() {
            if (isOpen) {
                setIsOpen(false)
                setDropdownPos(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        window.addEventListener('scroll', handleScroll, true)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            window.removeEventListener('scroll', handleScroll, true)
        }
    }, [isOpen])

    useEffect(() => {
        setHighlightIndex(-1)
    }, [searchText])

    useEffect(() => {
        if (highlightIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('[data-option]')
            items[highlightIndex]?.scrollIntoView({ block: 'nearest' })
        }
    }, [highlightIndex])

    const handleSelect = useCallback((optionValue: string) => {
        onChange(optionValue)
        const opt = options.find(o => o.value === optionValue)
        setSearchText(opt?.label ?? '')
        setIsOpen(false)
        setDropdownPos(null)
    }, [onChange, options])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value)
        setIsOpen(true)
    }

    const handleFocus = () => {
        setIsOpen(true)
        setSearchText('')
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
        }
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange('')
        setSearchText('')
        setIsOpen(false)
        setDropdownPos(null)
        inputRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true)
                e.preventDefault()
            }
            return
        }

        const maxIndex = filteredOptions.length + (showCreateOption ? 1 : 0) - 1

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setHighlightIndex(prev => (prev < maxIndex ? prev + 1 : 0))
                break
            case 'ArrowUp':
                e.preventDefault()
                setHighlightIndex(prev => (prev > 0 ? prev - 1 : maxIndex))
                break
            case 'Enter':
                e.preventDefault()
                if (highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
                    handleSelect(filteredOptions[highlightIndex].value)
                } else if (showCreateOption && highlightIndex === filteredOptions.length) {
                    setShowCreateDialog(true)
                }
                break
            case 'Escape':
                setIsOpen(false)
                setDropdownPos(null)
                setSearchText(selectedOption?.label ?? '')
                break
        }
    }

    const handleCreated = (id: number, newLabel: string) => {
        const newOption = { value: String(id), label: newLabel }
        onOptionCreated?.(newOption)
        onChange(String(id))
        setSearchText(newLabel)
        setShowCreateDialog(false)
        setIsOpen(false)
    }

    return (
        <>
            <div ref={containerRef} className="relative mt-1.5">
                <div className="relative">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        ref={inputRef}
                        type="text"
                        value={displayText}
                        onChange={handleInputChange}
                        onFocus={handleFocus}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className={`${inputClass} pl-9 pr-16`}
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                        aria-label={label}
                    />
                    <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                        {value && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                aria-label="Clear selection"
                            >
                                <X size={14} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                if (isOpen) {
                                    setIsOpen(false)
                                    setDropdownPos(null)
                                } else {
                                    setIsOpen(true)
                                    inputRef.current?.focus()
                                    if (containerRef.current) {
                                        const rect = containerRef.current.getBoundingClientRect()
                                        setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
                                    }
                                }
                            }}
                            className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                            aria-label="Toggle dropdown"
                        >
                            <ChevronDown size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && dropdownPos && typeof document !== 'undefined' && createPortal(
                <ul
                    ref={listRef}
                    role="listbox"
                    className="z-[100] max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                    style={{
                        position: 'fixed',
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                        width: dropdownPos.width,
                    }}
                >
                    {filteredOptions.length === 0 && !showCreateOption && (
                        <li className="px-3 py-2 text-sm text-slate-400">No matches</li>
                    )}
                    {filteredOptions.map((option, index) => (
                        <li
                            key={option.value}
                            data-option
                            role="option"
                            aria-selected={option.value === value}
                            className={`cursor-pointer px-3 py-2 text-sm ${
                                index === highlightIndex
                                    ? 'bg-blue-50 text-blue-900'
                                    : option.value === value
                                        ? 'bg-blue-100/50 font-medium text-blue-900'
                                        : 'text-slate-700 hover:bg-slate-50'
                            }`}
                            onClick={() => handleSelect(option.value)}
                            onMouseEnter={() => setHighlightIndex(index)}
                        >
                            {option.label}
                        </li>
                    ))}
                    {showCreateOption && (
                        <li
                            data-option
                            role="option"
                            className={`flex cursor-pointer items-center gap-2 border-t border-slate-100 px-3 py-2 text-sm font-medium text-blue-600 ${
                                highlightIndex === filteredOptions.length
                                    ? 'bg-blue-50'
                                    : 'hover:bg-blue-50/50'
                            }`}
                            onClick={() => setShowCreateDialog(true)}
                            onMouseEnter={() => setHighlightIndex(filteredOptions.length)}
                        >
                            <Plus size={15} />
                            Create &quot;{searchText.trim()}&quot;
                        </li>
                    )}
                </ul>,
                document.body,
            )}

            {showCreateDialog && targetTable && (
                <CreateRowDialog
                    tableName={targetTable}
                    initialName={searchText.trim()}
                    onCreated={handleCreated}
                    onClose={() => {
                        setShowCreateDialog(false)
                        inputRef.current?.focus()
                    }}
                />
            )}
        </>
    )
}
