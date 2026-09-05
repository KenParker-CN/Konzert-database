import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { CategoryInfo } from './tableMetadata'

interface TablesOverviewProps {
    categories: CategoryInfo[]
}

export default function TablesOverview({ categories }: TablesOverviewProps) {
    return (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(category => (
                <Link
                    key={category.slug}
                    href={`/admin/database/${category.slug}`}
                    className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="heading text-lg font-semibold text-slate-900">{category.label}</h2>
                            <p className="mt-1 text-sm text-slate-500">{category.description}</p>
                        </div>
                        <ChevronRight size={18} className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" />
                    </div>
                    <div className="mt-4 flex-1 space-y-1.5">
                        {category.tables.map(table => (
                            <div key={table.name} className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">{table.label}</span>
                                <span className="tabular-nums text-slate-400">{table.rowCount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-400">
                        {category.tables.length} table{category.tables.length !== 1 ? 's' : ''}
                    </div>
                </Link>
            ))}
        </div>
    )
}
