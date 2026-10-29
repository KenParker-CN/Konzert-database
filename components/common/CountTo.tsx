'use client'

import {useEffect, useState} from 'react'

export default function CountTo({value, duration = 1500}: {value: number; duration?: number}) {
    const [display, setDisplay] = useState(0)

    useEffect(() => {
        if (value <= 0) {
            setDisplay(value)
            return
        }
        let start: number | null = null
        let raf = 0
        const step = (timestamp: number) => {
            if (start === null) start = timestamp
            const progress = Math.min((timestamp - start) / duration, 1)
            // easeOutCubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(Math.round(value * eased))
            if (progress < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [value, duration])

    return <span className="tabular-nums">{display.toLocaleString()}</span>
}
