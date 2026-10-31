import {IconChevronRight} from '@tabler/icons-react'
import Link from 'next/link'
import {Fragment} from 'react'

export type InstrumentBreadcrumbItem = {label: string; href?: string}

export default function InstrumentBreadcrumb({items}: {items: InstrumentBreadcrumbItem[]}) {
    return (
        <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
                {items.map((item, index) => {
                    const current = index === items.length - 1
                    return (
                        <Fragment key={`${index}-${item.label}`}>
                            {index > 0 && (
                                <li aria-hidden="true"><IconChevronRight size={14} className="text-slate-400"/></li>
                            )}
                            <li aria-current={current ? 'page' : undefined}>
                                {item.href && !current ? (
                                    <Link href={item.href} className="font-medium text-blue-600 hover:underline">{item.label}</Link>
                                ) : (
                                    <span className={current ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}>{item.label}</span>
                                )}
                            </li>
                        </Fragment>
                    )
                })}
            </ol>
        </nav>
    )
}
