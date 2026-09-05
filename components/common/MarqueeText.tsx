'use client'

import { useRef, useState, useEffect, type ReactNode } from 'react'

interface MarqueeTextProps {
    children: ReactNode
    className?: string
    speed?: number
}

/**
 * Text that truncates with ellipsis by default, and shows a marquee animation on hover when text overflows.
 */
export default function MarqueeText({ children, className = '', speed = 10 }: MarqueeTextProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const [isOverflowing, setIsOverflowing] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [textLength, setTextLength] = useState(0)

    useEffect(() => {
        if (textRef.current) {
            setTextLength(textRef.current.textContent?.length ?? 0)
        }
    }, [children])

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                const containerWidth = containerRef.current.clientWidth
                const textWidth = textRef.current.scrollWidth
                setIsOverflowing(textWidth > containerWidth)
            }
        }

        checkOverflow()
        window.addEventListener('resize', checkOverflow)
        return () => window.removeEventListener('resize', checkOverflow)
    }, [children])

    const duration = Math.max(speed, textLength * 0.3)

    return (
        <div
            ref={containerRef}
            className={`overflow-hidden ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                ref={textRef}
                className={`whitespace-nowrap ${isHovered && isOverflowing ? 'animate-marquee' : 'truncate'}`}
                style={isHovered && isOverflowing ? { animationDuration: `${duration}s` } : undefined}
            >
                {children}
            </div>
        </div>
    )
}
