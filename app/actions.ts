'use server'

import {cookies} from 'next/headers'
import {clearCsvCache} from '@/lib/data/csv-loader'

export async function refreshCatalogueCache() {
    const version = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    const cookieStore = await cookies()
    cookieStore.set('catalogue-data-version', version, {
        httpOnly: true,
        maxAge: 60 * 60 * 24,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    })
    clearCsvCache()
}
