'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
    Combobox,
    ComboboxChips,
    ComboboxChip,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    useComboboxAnchor,
} from '@/components/ui/combobox'
import CreateRowDialog from './CreateRowDialog'

type FkOption = { value: string; label: string }

type MultiFkSelectProps = {
    value: string[]
    onChange: (value: string[]) => void
    options: FkOption[]
    placeholder: string
    targetTable?: string
    allowCreate?: boolean
    onOptionCreated?: (option: FkOption) => void
}

export default function MultiFkSelect({
    value,
    onChange,
    options,
    placeholder,
    targetTable,
    allowCreate,
    onOptionCreated,
}: MultiFkSelectProps) {
    const [inputText, setInputText] = useState('')
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const anchorRef = useComboboxAnchor()

    const valueToLabel = useMemo(
        () => new Map(options.map(o => [o.value, o.label])),
        [options],
    )

    const selectedSet = useMemo(() => new Set(value), [value])

    const filteredOptions = useMemo(() => {
        const available = options.filter(o => !selectedSet.has(o.value))
        if (!inputText.trim()) return available
        const lower = inputText.toLowerCase()
        return available.filter(o => o.label.toLowerCase().includes(lower))
    }, [options, selectedSet, inputText])

    const exactMatch = useMemo(() => {
        if (!inputText.trim()) return false
        const lower = inputText.toLowerCase()
        return options.some(o => o.label.toLowerCase() === lower)
    }, [options, inputText])

    const showCreateOption = !!allowCreate && inputText.trim().length > 0 && !exactMatch

    const handleCreated = (id: number, newLabel: string) => {
        const newOption = { value: String(id), label: newLabel }
        onOptionCreated?.(newOption)
        onChange([...value, String(id)])
        setShowCreateDialog(false)
    }

    return (
        <>
            <div ref={anchorRef} className="mt-1.5">
                <Combobox
                    multiple
                    value={value}
                    onValueChange={(val) => onChange(val as string[])}
                    itemToStringLabel={(v: string) => valueToLabel.get(v) ?? v}
                    onInputValueChange={(v) => setInputText(v)}
                    onOpenChange={(open) => { if (!open) setInputText('') }}
                >
                    <ComboboxChips className="min-h-10 rounded-xl border-slate-200 bg-slate-50 px-2.5 py-1.5 focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-100">
                        {value.map(v => (
                            <ComboboxChip
                                key={v}
                                className="rounded-lg bg-blue-100 px-2 text-sm font-medium text-white"
                            >
                                {valueToLabel.get(v) ?? v}
                            </ComboboxChip>
                        ))}
                        <ComboboxChipsInput placeholder={value.length === 0 ? placeholder : ''} />
                    </ComboboxChips>

                    <ComboboxContent anchor={anchorRef} className="max-h-60 min-w-(--anchor-width) overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                        <ComboboxList className="max-h-none overflow-visible p-0">
                            {filteredOptions.map(option => (
                                <ComboboxItem key={option.value} value={option.value}>
                                    {option.label}
                                </ComboboxItem>
                            ))}
                        </ComboboxList>
                        <ComboboxEmpty>No matches</ComboboxEmpty>
                        {showCreateOption && (
                            <div
                                className="mt-1 flex cursor-pointer items-center gap-2 border-t border-slate-100 px-3 py-2 text-sm font-medium text-blue-600 rounded-b-lg hover:bg-blue-50"
                                onPointerDown={(e) => e.preventDefault()}
                                onClick={() => setShowCreateDialog(true)}
                            >
                                <Plus size={15} />
                                Create &quot;{inputText.trim()}&quot;
                            </div>
                        )}
                    </ComboboxContent>
                </Combobox>
            </div>

            {showCreateDialog && targetTable && (
                <CreateRowDialog
                    tableName={targetTable}
                    initialName={inputText.trim()}
                    onCreated={handleCreated}
                    onClose={() => setShowCreateDialog(false)}
                />
            )}
        </>
    )
}
