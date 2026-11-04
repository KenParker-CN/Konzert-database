'use client'

import {useEffect, useRef} from 'react'

export function ScrollProgress() {
    const barRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const bar = barRef.current
        if (!bar) return
        let frame = 0

        const update = () => {
            frame = 0
            const max = document.documentElement.scrollHeight - window.innerHeight
            const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0
            bar.style.transform = `scaleX(${ratio})`
        }
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update)
        }

        update()
        window.addEventListener('scroll', onScroll, {passive: true})
        window.addEventListener('resize', onScroll)
        return () => {
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('resize', onScroll)
            if (frame) cancelAnimationFrame(frame)
        }
    }, [])

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px]">
            <div
                ref={barRef}
                className="h-full origin-left bg-[#29d] shadow-[0_0_10px_#29d,0_0_5px_#29d]"
                style={{transform: 'scaleX(0)'}}
            />
        </div>
    )
}
