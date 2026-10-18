'use server'

import {clearCsvCache, clearCatalogueCache} from '@/lib/data/csv-loader'
import {clearCatalogueDirectoryCache} from '@/lib/db/composers'

export async function refreshCatalogueCache() {
    clearCsvCache()
    clearCatalogueDirectoryCache()
}

export async function refreshCatalogueWorksCache(catalogCode: string) {
    clearCatalogueCache(catalogCode)
    clearCatalogueDirectoryCache()
}
