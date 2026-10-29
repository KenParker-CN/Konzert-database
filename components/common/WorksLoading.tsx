export default function WorksLoading({label}: {label: string}) {
    return (
        <section className="min-w-0" aria-busy="true" aria-live="polite">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
                    <div className="h-5 w-2/3 max-w-md animate-pulse rounded bg-slate-100"/>
                    <div className="h-4 w-20 animate-pulse rounded bg-slate-100"/>
                </div>
                <div className="grid grid-cols-1 gap-2 border-b border-slate-200 p-3 sm:grid-cols-2">
                    {Array.from({length: 4}, (_, index) => (
                        <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100"/>
                    ))}
                </div>
                <div className="divide-y divide-slate-100">
                    {Array.from({length: 8}, (_, index) => (
                        <div key={index} className="flex items-center gap-3 px-4 py-3">
                            <div className="h-4 w-24 shrink-0 animate-pulse rounded bg-slate-100"/>
                            <div className={`h-4 animate-pulse rounded bg-slate-100 ${index % 3 === 0 ? 'w-3/4' : index % 3 === 1 ? 'w-1/2' : 'w-2/3'}`}/>
                        </div>
                    ))}
                </div>
                <p className="px-5 py-4 text-center text-sm text-slate-500">{label}</p>
            </div>
        </section>
    )
}
