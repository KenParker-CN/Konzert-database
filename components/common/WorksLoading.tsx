export default function WorksLoading({label}: {label: string}) {
    return (
        <section className="mt-8" aria-busy="true" aria-live="polite">
            <div className="mb-3">
                <div className="h-8 w-32 animate-pulse rounded-md bg-slate-200"/>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                    <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-slate-100"/>
                </div>
                <div className="divide-y divide-slate-100">
                    {Array.from({length: 8}, (_, index) => (
                        <div key={index} className="grid grid-cols-[7rem_1fr_6rem_6rem] gap-4 px-5 py-4">
                            <div className="h-4 animate-pulse rounded bg-slate-100"/>
                            <div className="h-4 animate-pulse rounded bg-slate-100"/>
                            <div className="h-4 animate-pulse rounded bg-slate-100"/>
                            <div className="h-4 animate-pulse rounded bg-slate-100"/>
                        </div>
                    ))}
                </div>
                <p className="px-5 py-4 text-center text-sm text-slate-500">{label}</p>
            </div>
        </section>
    )
}
