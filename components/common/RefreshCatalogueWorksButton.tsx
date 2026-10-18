'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {IconRefresh} from '@tabler/icons-react'
import {refreshCatalogueWorksCache} from '@/app/actions'

interface RefreshCatalogueWorksButtonProps {
    catalogCode: string
}

export default function RefreshCatalogueWorksButton({catalogCode}: RefreshCatalogueWorksButtonProps) {
    const router = useRouter()
    const [isRefreshing, setIsRefreshing] = useState(false)

    async function handleRefresh() {
        setIsRefreshing(true)
        try {
            await refreshCatalogueWorksCache(catalogCode)
            router.refresh()
        } finally {
            setIsRefreshing(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="ml-2 inline-flex shrink-0 text-slate-400 transition hover:text-slate-600 disabled:opacity-50"
            title="Reload from local files"
        >
            <IconRefresh size={18} className={isRefreshing ? 'animate-spin' : ''}/>
        </button>
    )
}
