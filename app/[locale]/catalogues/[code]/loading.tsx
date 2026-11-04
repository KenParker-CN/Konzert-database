import AppShell from '@/components/AppShell'
import WorksLoading from '@/components/catalogues/WorksLoading'

export default function CatalogueDetailLoading() {
    return (
        <AppShell active="catalogues">
            <main className="min-h-full">
                <div className="mx-auto max-w-300 px-5 py-4 lg:px-10 lg:py-5">
                    <div className="flex flex-col gap-4">
                        <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-busy="true">
                            <div className="h-8 w-2/3 max-w-md animate-pulse rounded bg-slate-100"/>
                            <div className="flex flex-col gap-2">
                                <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-slate-100"/>
                                <div className="h-4 w-3/4 max-w-xl animate-pulse rounded bg-slate-100"/>
                            </div>
                        </section>
                        <div className="flex min-w-0 flex-col gap-4">
                            <WorksLoading label="Loading works…"/>
                        </div>
                    </div>
                </div>
            </main>
        </AppShell>
    )
}
