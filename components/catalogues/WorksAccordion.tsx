'use client'

import {useState} from 'react'
import WorksTable from '@/components/catalogues/WorksTable'
import type {WorkCategoryGroup} from '@/lib/data/work-groups'

export default function WorksAccordion({
    groups,
    catalogCode,
    otherTitle,
}: {
    groups: WorkCategoryGroup[]
    catalogCode: string
    otherTitle: string
}) {
    const [openPath, setOpenPath] = useState<string[]>([])

    function toggleGroup(path: string[]) {
        setOpenPath(current =>
            current.length === path.length && current.every((key, index) => key === path[index])
                ? []
                : path,
        )
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {groups.map(group => (
                <WorksTable
                    key={group.key}
                    title={group.key === 'other' ? otherTitle : group.label}
                    works={group.works}
                    catalogCode={catalogCode}
                    path={[group.key]}
                    openPath={openPath}
                    onToggle={toggleGroup}
                    children={group.children}
                />
            ))}
        </div>
    )
}
