import Link from 'next/link'

function adminEnabled() {
    return process.env.NODE_ENV !== 'production' || process.env.ADMIN_DATABASE === '1'
}

export default function AdminDatabaseLayout({ children }: { children: React.ReactNode }) {
    if (!adminEnabled()) {
        return (
            <main className="flex min-h-screen items-center justify-center px-6">
                <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="heading text-xl font-semibold text-slate-900">Database admin</h1>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        The database editor is disabled in this environment.
                        Run the app in development mode, or start it with <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">ADMIN_DATABASE=1</code>.
                    </p>
                    <Link href="/en" className="mt-6 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                        Back to the archive
                    </Link>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10 lg:py-12">
                {children}
            </div>
        </main>
    )
}
