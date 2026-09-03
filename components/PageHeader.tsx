import type { ReactNode } from 'react'

export default function PageHeader({ badge, title, description, actions }: { badge?: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl">{badge && <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{badge}</div>}<h1 className="heading text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{title}</h1><p className="mt-3 text-base leading-7 text-slate-600">{description}</p></div>{actions && <div className="w-full shrink-0 lg:w-auto">{actions}</div>}</div>
}
