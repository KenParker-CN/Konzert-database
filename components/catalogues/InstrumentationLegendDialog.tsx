'use client'

import {useEffect, useRef, useState} from 'react'
import {Dialog} from '@base-ui/react/dialog'
import {IconChevronDown, IconInfoCircle, IconX} from '@tabler/icons-react'
import {useI18n} from '@/lib/i18n/client'
import {INSTRUMENTATION_ABBREVIATIONS} from '@/lib/i18n/instrumentation-abbreviations'

/**
 * 配器缩写 legend 弹窗：展示 Boosey & Hawkes 标准配器缩写对照表。
 * 以 info 图标触发，嵌套于作品详情弹窗之上。
 * 打开时默认定位到触发点（作品详情窗口）右侧；右侧放不下则折回左侧。
 * 单列布局，每组可展开 / 收起（默认全部收起）。
 * 弹窗标题栏可拖拽移动；双击标题栏还原到默认位置。
 */
type LocalizedField = 'en' | 'zh' | 'fr' | 'de'

export default function InstrumentationLegendDialog({triggerClassName}: {triggerClassName?: string}) {
    const {t, locale} = useI18n()
    const field = (locale === 'zh' || locale === 'fr' || locale === 'de' ? locale : 'en') as LocalizedField

    const [open, setOpen] = useState(false)
    const [offset, setOffset] = useState({x: 0, y: 0})
    const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(INSTRUMENTATION_ABBREVIATIONS.map(g => g.key)))
    const defaultOffset = useRef({x: 0, y: 0})
    const dragging = useRef(false)
    const grab = useRef({startX: 0, startY: 0, baseX: 0, baseY: 0})
    const triggerRef = useRef<HTMLButtonElement>(null)
    const popupRef = useRef<HTMLDivElement>(null)

    // 打开时把弹窗定位到触发点（详情窗口）右侧；右侧放不下则折回左侧。
    useEffect(() => {
        if (!open) return
        const btn = triggerRef.current
        if (!btn) return
        const rect = btn.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight
        const popupWidth = popupRef.current?.offsetWidth || 384
        const margin = 12
        const fitsRight = rect.right + margin + popupWidth <= vw - 8
        const left = fitsRight ? rect.right + margin : Math.max(8, rect.left - margin - popupWidth)
        // 垂直方向与触发点对齐，并限制在视口内
        const centerY = rect.top + rect.height / 2
        const clampedY = Math.max(-vh * 0.45, Math.min(vh * 0.45, centerY - vh / 2))
        const next = {x: left + popupWidth / 2 - vw / 2, y: clampedY}
        defaultOffset.current = next
        setOffset(next)
    }, [open])

    const toggleGroup = (key: string) => {
        setCollapsed(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
        if (e.button !== 0) return
        dragging.current = true
        grab.current = {startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y}
        e.currentTarget.setPointerCapture(e.pointerId)
    }
    const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
        if (!dragging.current) return
        let dx = grab.current.baseX + (e.clientX - grab.current.startX)
        let dy = grab.current.baseY + (e.clientY - grab.current.startY)
        // 边界约束：不让弹窗完全移出视口
        const maxX = window.innerWidth * 0.55
        const maxY = window.innerHeight * 0.55
        dx = Math.max(-maxX, Math.min(maxX, dx))
        dy = Math.max(-maxY, Math.min(maxY, dy))
        setOffset({x: dx, y: dy})
    }
    const endDrag = (e: React.PointerEvent<HTMLElement>) => {
        if (dragging.current && e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
        }
        dragging.current = false
    }
    const resetPosition = () => setOffset(defaultOffset.current)

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
                ref={triggerRef}
                className={triggerClassName}
                aria-label={t('works.viewInstrumentationAbbreviations')}
                title={t('works.instrumentationAbbreviations')}
            >
                <IconInfoCircle size={12}/>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/40 transition-opacity data-ending-style:opacity-0"/>
                <Dialog.Popup
                    ref={popupRef}
                    className="fixed left-1/2 top-1/2 z-[60] flex max-h-[min(80vh,42rem)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden border border-slate-200 bg-white shadow-xl outline-none"
                    style={{transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`}}
                >
                    <div
                        className="relative flex cursor-move select-none items-center justify-between border-b border-slate-200 px-5 py-3 pr-12 touch-none"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onDoubleClick={resetPosition}
                        title={t('works.dragToMove')}
                    >
                        <Dialog.Title className="heading text-base font-semibold text-slate-950">
                            {t('works.instrumentationAbbreviations')}
                        </Dialog.Title>
                        <Dialog.Close
                            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            aria-label={t('common.close')}
                            onPointerDown={e => e.stopPropagation()}
                            onDoubleClick={e => e.stopPropagation()}
                        >
                            <IconX size={18}/>
                        </Dialog.Close>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-5">
                        <dl className="min-h-0 flex flex-col gap-3">
                            {INSTRUMENTATION_ABBREVIATIONS.map(group => {
                                const isCollapsed = collapsed.has(group.key)
                                return (
                                    <section key={group.key} className="min-w-0 rounded-lg border border-slate-200">
                                        <button
                                            type="button"
                                            className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-blue-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                            aria-expanded={!isCollapsed}
                                            onClick={() => toggleGroup(group.key)}
                                        >
                                            <span>{group[field]}</span>
                                            <IconChevronDown
                                                size={16}
                                                className={`shrink-0 text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                                            />
                                        </button>
                                        {!isCollapsed && (
                                            <dl className="grid min-h-0 grid-cols-1 gap-x-6 gap-y-1 px-3 pb-3 pt-1">
                                                {group.items.map(item => (
                                                    <div key={item.abbrev} className="flex items-baseline justify-between gap-3 text-sm">
                                                        <dt className="shrink-0 font-mono text-slate-500">{item.abbrev}</dt>
                                                        <dd className="min-w-0 text-right text-slate-900">{item[field]}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        )}
                                    </section>
                                )
                            })}
                        </dl>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
