import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BreadcrumbNav from '../BreadcrumbNav'
import CategoryOverview from '../CategoryOverview'
import HeaderCard from '../HeaderCard'
import { getTables, getTableRowCounts } from '@/lib/db/admin'
import {
    buildCategoryOverview,
    getGroupBySlug,
} from '../tableMetadata'

export const metadata: Metadata = {
    title: 'Database admin · Parker\'s',
}

export const dynamic = 'force-dynamic'

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const { category: slug } = await params

    const group = getGroupBySlug(slug)
    if (!group || group === 'other') notFound()

    const tables = getTables()
    const rowCountMap = getTableRowCounts(tables)
    const categories = buildCategoryOverview(tables, rowCountMap)
    const category = categories.find(c => c.slug === slug)
    if (!category) notFound()

    const breadcrumbItems = [
        { type: 'link' as const, href: '/admin/database', label: 'Database' },
        { type: 'static' as const, label: category.label },
    ]

    return (
        <div className="space-y-6">
            <BreadcrumbNav
                tables={tables}
                items={breadcrumbItems}
                categoryGroup={group}
            />
            <HeaderCard
                title={category.label}
                description={category.description}
            />
            <CategoryOverview category={category} />
        </div>
    )
}
