'use client'

import { useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { getData } from 'country-list'
import { cn } from '@/lib/utils'

const countries = getData().map(c => ({
    code: c.code,
    name: c.name.replace(/\s*\(.*?\)\s*/g, '').trim(),
}))

interface CountrySelectProps {
    value: string
    onChange: (code: string) => void
    placeholder?: string
    className?: string
}

export default function CountrySelect({ value, onChange, placeholder = 'Select country…', className }: CountrySelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [highlightIndex, setHighlightIndex] = useState(-1)

    const filtered = useMemo(() => {
        if (!search.trim()) return countries
        const lower = search.toLowerCase()
        return countries.filter(c =>
            c.name.toLowerCase().includes(lower) || c.code.toLowerCase().includes(lower),
        )
    }, [search])

    const selected = countries.find(c => c.code === value)

    function handleSelect(code: string) {
        onChange(code)
        setSearch('')
        setIsOpen(false)
        setHighlightIndex(-1)
    }

    function handleClear(e: React.MouseEvent) {
        e.stopPropagation()
        onChange('')
        setSearch('')
        inputRef.current?.focus()
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true)
                e.preventDefault()
            }
            return
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setHighlightIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0))
                break
            case 'ArrowUp':
                e.preventDefault()
                setHighlightIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1))
                break
            case 'Enter':
                e.preventDefault()
                if (highlightIndex >= 0 && highlightIndex < filtered.length) {
                    handleSelect(filtered[highlightIndex].code)
                }
                break
            case 'Escape':
                setIsOpen(false)
                setSearch('')
                setHighlightIndex(-1)
                break
        }
    }

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={isOpen ? search : (selected?.name ?? '')}
                    onChange={e => { setSearch(e.target.value); setIsOpen(true); setHighlightIndex(-1) }}
                    onFocus={() => { setIsOpen(true); setSearch('') }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    readOnly={!isOpen}
                    className={cn(
                        'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-16 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100',
                        className,
                    )}
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-label="Country"
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    {value && (
                        <button type="button" onClick={handleClear}
                                className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                aria-label="Clear">
                            <X size={14} />
                        </button>
                    )}
                    <button type="button"
                            onClick={() => { setIsOpen(v => !v); setSearch(''); inputRef.current?.focus() }}
                            className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                            aria-label="Toggle dropdown">
                        <ChevronDown size={15} />
                    </button>
                </div>
            </div>

            {isOpen && (
                <ul className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                    role="listbox">
                    {filtered.length === 0 && (
                        <li className="px-3 py-2 text-sm text-slate-400">No matches</li>
                    )}
                    {filtered.map((country, index) => (
                        <li key={country.code}
                            role="option"
                            aria-selected={country.code === value}
                            className={cn(
                                'flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors',
                                index === highlightIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50',
                                country.code === value && 'font-medium text-blue-700',
                            )}
                            onClick={() => handleSelect(country.code)}
                            onMouseEnter={() => setHighlightIndex(index)}>
                            <span>{country.name}</span>
                            <span className="text-xs text-slate-400">{country.code}</span>
                            {country.code === value && <Check size={14} className="text-blue-600" />}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
