import AppShell from '@/components/AppShell'
import WorksLoading from '@/components/common/WorksLoading'

export default function CatalogueDetailLoading() {
    return (
        <AppShell active="catalogues">
            <main className="min-h-screen">
                <div className="mx-auto max-w-300 px-5 py-10 lg:px-10 lg:py-14">
                    <div className="h-5 w-40 animate-pulse rounded bg-slate-200"/>
                    <div className="mt-7 flex flex-col gap-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(12rem,3fr)_minmax(0,7fr)]">
                            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                                <div className="h-8 w-3/4 max-w-sm animate-pulse rounded bg-slate-200"/>
                                <div className="mt-3 h-4 w-32 animate-pulse rounded bg-slate-100"/>
                                <div className="mt-5 flex flex-col gap-2">
                                    <div className="h-4 w-full animate-pulse rounded bg-slate-100"/>
                                    <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100"/>
                                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100"/>
                                </div>
                            </section>
                            <section className="flex min-h-40 min-w-0 flex-col justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                                <div className="h-8 w-3/4 max-w-lg animate-pulse rounded bg-slate-200"/>
                                <div className="mt-3 h-4 w-40 animate-pulse rounded bg-slate-100"/>
                            </section>
                        </div>
                        <WorksLoading label="Loading works…"/>
                    </div>
                </div>
            </main>
        </AppShell>
    )
}
