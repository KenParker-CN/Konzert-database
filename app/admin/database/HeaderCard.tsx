'use client'

import { useRouter } from 'next/navigation'
import { Terminal } from 'lucide-react'

interface HeaderCardProps {
    title: string
    description: string
}

export default function HeaderCard({ title, description }: HeaderCardProps) {
    const router = useRouter()

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <h1 className="heading text-2xl font-semibold text-slate-900">{title}</h1>
                    <p className="mt-1.5 text-sm text-slate-500">{description}</p>
                </div>
                <button
                    type="button"
                    onClick={() => router.push('/admin/database/sql')}
                    className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-700"
                >
                    <Terminal size={14} aria-hidden="true" />
                    <span className="hidden sm:inline">SQL Console</span>
                </button>
            </div>
        </div>
    )
}
