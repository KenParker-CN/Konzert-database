'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {IconRefresh} from '@tabler/icons-react'
import {useI18n} from '@/lib/i18n/client'
import {refreshCatalogueWorksCache} from '@/app/actions'

interface RefreshCatalogueWorksButtonProps {
    catalogCode: string
}

export default function RefreshCatalogueWorksButton({catalogCode}: RefreshCatalogueWorksButtonProps) {
    const {t} = useI18n()
    const router = useRouter()
    const [isRefreshing, setIsRefreshing] = useState(false)

    async function handleRefresh() {
        setIsRefreshing(true)
        try {
            await refreshCatalogueWorksCache(catalogCode)
            router.refresh()
        } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Refresh failed')
        } finally {
            setIsRefreshing(false)
        }
    }

    return (
        <div className="absolute right-3 top-3 flex items-center gap-2">
            {isRefreshing && (
                <span role="status" aria-live="polite" className="text-xs text-slate-500">
                    {t('catalogues.kvRefreshHint')}
                </span>
            )}
            <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label="Reload works from the API"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 disabled:opacity-50"
                title="Reload from the API"
            >
                <IconRefresh size={15} className={isRefreshing ? 'animate-spin' : ''}/>
            </button>
        </div>
    )
}
