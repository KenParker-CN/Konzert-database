'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {IconRefresh} from '@tabler/icons-react'
import {Button} from '@/components/ui/button'
import {useI18n} from '@/lib/i18n/client'
import {refreshCatalogueCache} from '@/app/actions'

export default function RefreshCatalogueCacheButton() {
    const {t} = useI18n()
    const router = useRouter()
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [hasError, setHasError] = useState(false)

    async function handleRefresh() {
        setIsRefreshing(true)
        setHasError(false)
        try {
            await refreshCatalogueCache()
            router.refresh()
        } catch {
            setHasError(true)
        } finally {
            setIsRefreshing(false)
        }
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <Button type="button" variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <IconRefresh data-icon="inline-start" className={isRefreshing ? 'animate-spin' : ''}/>
                {isRefreshing ? t('catalogues.refreshingCache') : t('catalogues.refreshCache')}
            </Button>
            {hasError && <p role="alert" className="text-xs text-destructive">{t('catalogues.refreshCacheFailed')}</p>}
        </div>
    )
}
