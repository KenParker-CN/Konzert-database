'use client'

import {useEffect} from 'react'

export default function WorksScrollAnchor({focus}: {focus?: string}) {
    useEffect(() => {
        if (focus === 'works') {
            const element = document.getElementById('works')
            if (element) {
                element.scrollIntoView({behavior: 'smooth', block: 'start'})
            }
        }
    }, [focus])

    return null
}
