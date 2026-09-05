import Link from 'next/link'
import { ChevronRight, ArrowRight } from 'lucide-react'
import type { CategoryInfo } from './tableMetadata'

interface CategoryOverviewProps {
    category: CategoryInfo
}

export default function CategoryOverview({ category }: CategoryOverviewProps) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {category.tables.map(table => (
                <Link
                    key={table.name}
                    href={`/admin/database/${category.slug}/${table.name}`}
                    className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-900">{table.label}</h3>
                        {table.relationship ? (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">{table.relationship.from}</span>
                                <ArrowRight size={10} className="shrink-0 text-slate-400" />
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">{table.relationship.to}</span>
                            </p>
                        ) : (
                            <p className="mt-1 text-xs text-slate-500">{table.description}</p>
                        )}
                        <p className="mt-2 text-xs tabular-nums text-slate-400">
                            {table.rowCount.toLocaleString()} row{table.rowCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <ChevronRight size={16} className="mt-0.5 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" />
                </Link>
            ))}
        </div>
    )
}
