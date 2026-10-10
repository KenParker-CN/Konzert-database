import AppShell from '@/components/AppShell'
import WorksLoading from '@/components/common/WorksLoading'

export default function CatalogueDetailLoading() {
    return (
        <AppShell active="catalogues">
            <main className="min-h-screen">
                <div className="mx-auto max-w-300 px-5 py-10 lg:px-10 lg:py-14">
                    <div className="h-5 w-40 animate-pulse rounded bg-slate-200"/>
                    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex items-center gap-5">
                            <div className="h-20 w-20 shrink-0 animate-pulse rounded-2xl bg-slate-100"/>
                            <div className="min-w-0 flex-1 space-y-3">
                                <div className="h-8 w-56 max-w-full animate-pulse rounded bg-slate-200"/>
                                <div className="h-4 w-32 animate-pulse rounded bg-slate-100"/>
                                <div className="h-4 w-24 animate-pulse rounded bg-slate-100"/>
                            </div>
                        </div>
                        <div className="mt-6 h-36 animate-pulse rounded-xl bg-slate-50"/>
                    </section>
                    <WorksLoading label="Loading works…"/>
                </div>
            </main>
        </AppShell>
    )
}
