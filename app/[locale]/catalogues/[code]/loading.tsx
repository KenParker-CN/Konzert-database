import AppShell from '@/components/AppShell'
import WorksLoading from '@/components/catalogues/WorksLoading'

export default function CatalogueDetailLoading() {
    return (
        <AppShell active="catalogues">
            <main className="min-h-full">
                <div className="mx-auto max-w-300 px-5 py-4 lg:px-10 lg:py-5">
                    <div className="mt-4 flex flex-col gap-4">
                        <div className="flex min-w-0 flex-col gap-4">
                            <WorksLoading label="Loading works…"/>
                        </div>
                    </div>
                </div>
            </main>
        </AppShell>
    )
}
