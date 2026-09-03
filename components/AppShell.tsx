import type { ReactNode } from 'react'
import ThemeSelector from './ThemeSelector'

export default function AppShell({ children, active }: { children: ReactNode; active?: 'works' | 'composers' | 'artists' | 'albums' }) {
  const links = [['works', 'Works', '/works'], ['composers', 'Composers', '/composers'], ['artists', 'Artists', '/artists'], ['albums', 'Recordings', '/albums']] as const
  return <><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 py-4 lg:px-10"><a href="/" className="heading text-lg font-semibold tracking-tight">Parker’s</a><nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm text-slate-600"><a href="/" className="hidden hover:text-slate-950 sm:block">Home</a>{links.map(([id, label, href]) => <a key={id} href={href} className={active === id ? 'font-semibold text-blue-600' : 'hover:text-slate-950'}>{label}</a>)}</nav><ThemeSelector /></div></header>{children}</>
}
