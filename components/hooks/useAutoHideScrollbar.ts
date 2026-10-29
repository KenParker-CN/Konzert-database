'use client'

import {useEffect, useRef, useState} from 'react'

export default function useAutoHideScrollbar() {
    const [isScrolling, setIsScrolling] = useState(false)
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => () => {
        if (hideTimer.current) clearTimeout(hideTimer.current)
    }, [])

    function handleScroll() {
        setIsScrolling(true)
        if (hideTimer.current) clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(() => setIsScrolling(false), 700)
    }

    return {
        className: `auto-hide-scrollbar${isScrolling ? ' is-scrolling' : ''}`,
        onScroll: handleScroll,
    }
}
