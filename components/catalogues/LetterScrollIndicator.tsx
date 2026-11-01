'use client'

import {useEffect, useState} from 'react'

const IDLE_HIDE_DELAY_MS = 900
const ACTIVE_LINE_RATIO = 0.3

export default function LetterScrollIndicator({letters, label}: {letters: string[]; label: string}) {
    const [visible, setVisible] = useState(false)
    const [active, setActive] = useState(letters[0])

    useEffect(() => {
        let hideTimer: ReturnType<typeof setTimeout> | undefined

        const onScroll = () => {
            setVisible(true)
            clearTimeout(hideTimer)
            hideTimer = setTimeout(() => setVisible(false), IDLE_HIDE_DELAY_MS)

            let current = letters[0]
            for (const letter of letters) {
                const section = document.getElementById(`letter-${letter}`)
                if (section && section.getBoundingClientRect().top <= window.innerHeight * ACTIVE_LINE_RATIO) {
                    current = letter
                }
            }
            setActive(current)
        }

        window.addEventListener('scroll', onScroll, {passive: true})
        return () => {
            window.removeEventListener('scroll', onScroll)
            clearTimeout(hideTimer)
        }
    }, [letters])

    return (
        <nav
            aria-label={label}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            className={`fixed right-2 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-0.5 rounded-full border border-slate-200 bg-white/90 px-1 py-2 text-xs font-semibold shadow-md backdrop-blur transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
            {letters.map(letter => (
                <a
                    key={letter}
                    href={`#letter-${letter}`}
                    className={`inline-flex size-6 items-center justify-center rounded-full transition ${active === letter ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'}`}
                >
                    {letter}
                </a>
            ))}
        </nav>
    )
}
