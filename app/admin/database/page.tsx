import type { Metadata } from 'next'
import BreadcrumbNav from './BreadcrumbNav'
import HeaderCard from './HeaderCard'
import TablesOverview from './TablesOverview'
import { getTables, getTableRowCounts } from '@/lib/db/admin'
import { buildCategoryOverview } from './tableMetadata'

export const metadata: Metadata = {
    title: 'Database admin · Parker\'s',
}

export const dynamic = 'force-dynamic'

export default async function AdminDatabasePage() {
    const tables = await getTables()
    const rowCountMap = await getTableRowCounts(tables)
    const categories = buildCategoryOverview(tables, rowCountMap)

    return (
        <div className="space-y-6">
            <BreadcrumbNav
                tables={tables}
                items={[{ type: 'static', label: 'Database' }]}
            />
            <HeaderCard
                title="Tables"
                description="Browse and manage database tables by category."
            />
            <TablesOverview categories={categories} />
        </div>
    )
}
