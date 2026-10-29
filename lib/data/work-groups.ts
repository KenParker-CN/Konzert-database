import type {ComposerWork} from '@/lib/db/composers'

export const OTHER_CATEGORY_KEY = 'other'

function getCategoryLabel(workType: string): string | null {
    const trimmed = workType.trim()
    if (!trimmed || trimmed === '#N/A') return null
    return trimmed
}
export type WorkCategoryGroup = {
    key: string
    label: string
    works: ComposerWork[]
    children?: WorkCategoryGroup[]
}

export function compareWorksBySort(left: ComposerWork, right: ComposerWork): number {
    const leftSort = left.sort.trim()
    const rightSort = right.sort.trim()
    const leftNumber = Number(leftSort)
    const rightNumber = Number(rightSort)
    const bothNumeric = leftSort !== '' && rightSort !== '' && Number.isFinite(leftNumber) && Number.isFinite(rightNumber)

    if (!leftSort && rightSort) return 1
    if (leftSort && !rightSort) return -1
    return (bothNumeric
        ? leftNumber - rightNumber
        : leftSort.localeCompare(rightSort, undefined, {numeric: true, sensitivity: 'base'}))
        || left.workId - right.workId
}
export function groupWorksByCategory(works: ComposerWork[]): WorkCategoryGroup[] {
    const groups = new Map<string, WorkCategoryGroup>()
    const uncategorized: ComposerWork[] = []

    for (const work of works) {
        const label = getCategoryLabel(work.genre)
        if (!label) {
            uncategorized.push(work)
            continue
        }

        const key = label.toLocaleLowerCase()
        const group = groups.get(key)
        if (group) {
            group.works.push(work)
        } else {
            groups.set(key, {key, label, works: [work]})
        }
    }

    const result = [...groups.values()].sort((left, right) => {
        return left.label.localeCompare(right.label, undefined, {sensitivity: 'base'})
    })
    if (uncategorized.length > 0) {
        result.push({key: OTHER_CATEGORY_KEY, label: '', works: uncategorized})
    }
    return result
}
