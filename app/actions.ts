'use server'

import {clearCsvCache, clearCatalogueCache, refreshKvFromApi} from '@/lib/data/csv-loader'
import {clearCatalogueDirectoryCache} from '@/lib/db/composers'

export async function refreshCatalogueCache() {
    clearCsvCache()
    clearCatalogueDirectoryCache()
}

export async function refreshCatalogueWorksCache(catalogCode: string) {
    if (catalogCode === 'KV') {
        await refreshKvFromApi()
    } else {
        clearCatalogueCache(catalogCode)
    }
    clearCatalogueDirectoryCache()
}
