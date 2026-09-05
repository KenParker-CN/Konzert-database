import type { Metadata } from 'next'
import BreadcrumbNav from '../BreadcrumbNav'
import SqlConsole from '../SqlConsole'
import { getTables } from '@/lib/db/admin'

export const metadata: Metadata = {
    title: 'SQL Console · Database admin · Parker\'s',
}

export const dynamic = 'force-dynamic'

export default async function SqlConsolePage() {
    const tables = await getTables()

    const breadcrumbItems = [
        { type: 'link' as const, href: '/admin/database', label: 'Database' },
        { type: 'static' as const, label: 'SQL Console' },
    ]

    return (
        <div className="space-y-6">
            <BreadcrumbNav
                tables={tables}
                items={breadcrumbItems}
            />
            <SqlConsole />
        </div>
    )
}
