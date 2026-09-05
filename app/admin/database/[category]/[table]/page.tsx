import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BreadcrumbNav from '../../BreadcrumbNav'
import DatabaseAdmin from '../../DatabaseAdmin'
import HeaderCard from '../../HeaderCard'
import { getTables } from '@/lib/db/admin'
import {
    CATEGORY_META,
    getGroupBySlug,
    getTableGroup,
    getTableLabel,
    type TableGroup,
} from '../../tableMetadata'

export const metadata: Metadata = {
    title: 'Database admin · Parker\'s',
}

export const dynamic = 'force-dynamic'

export default async function TableDetailPage({ params }: { params: Promise<{ category: string; table: string }> }) {
    const { category: slug, table: tableName } = await params

    const group = getGroupBySlug(slug)
    if (!group || group === 'other') notFound()

    const tables = getTables()
    if (!tables.includes(tableName)) notFound()
    if (getTableGroup(tableName) !== group) notFound()

    const categoryMeta = CATEGORY_META[group as Exclude<TableGroup, 'other'>]
    const tableLabel = getTableLabel(tableName)

    const breadcrumbItems = [
        { type: 'link' as const, href: '/admin/database', label: 'Database' },
        { type: 'link' as const, href: `/admin/database/${categoryMeta.slug}`, label: categoryMeta.label },
        { type: 'static' as const, label: tableLabel },
    ]

    return (
        <div className="space-y-6">
            <BreadcrumbNav
                tables={tables}
                items={breadcrumbItems}
                categoryGroup={group}
                currentTable={tableName}
            />
            <HeaderCard
                title={categoryMeta.label}
                description={categoryMeta.description}
            />
            <DatabaseAdmin table={tableName} />
        </div>
    )
}
