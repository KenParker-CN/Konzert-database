'use server'

import {clearCsvCache} from '@/lib/data/csv-loader'

export async function refreshCatalogueCache() {
    clearCsvCache()
}
