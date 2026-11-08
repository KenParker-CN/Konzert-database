'use client'

import {useEffect, useState} from 'react'
import {usePathname} from 'next/navigation'

const STALL_TIMEOUT_MS = 10000

export function NavigationProgress() {
    const pathname = usePathname()
    const [pending, setPending] = useState(false)

    useEffect(() => {
        setPending(false)
    }, [pathname])

    useEffect(() => {
        if (!pending) return
        const timer = window.setTimeout(() => setPending(false), STALL_TIMEOUT_MS)
        return () => window.clearTimeout(timer)
    }, [pending])

    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0) return
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
            const anchor = (event.target as Element | null)?.closest('a')
            if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return
            const url = new URL(anchor.href, window.location.href)
            if (url.origin !== window.location.origin) return
            if (url.pathname === window.location.pathname && url.search === window.location.search) return
            setPending(true)
        }
        document.addEventListener('click', onClick)
        return () => document.removeEventListener('click', onClick)
    }, [])

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px]">
            <div
                className={`h-full origin-left bg-[#29d] shadow-[0_0_10px_#29d,0_0_5px_#29d] transition-[transform,opacity] ${
                    pending ? 'scale-x-[0.85] opacity-100 duration-[6000ms] ease-out' : 'scale-x-0 opacity-0 duration-300'
                }`}
            />
        </div>
    )
}
