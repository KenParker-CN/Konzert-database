export const COMPOSER_YEAR_MIN = 500
export const COMPOSER_YEAR_MAX = 2026

export type ComposerPeriodId =
    | 'Medieval'
    | 'Renaissance'
    | 'Baroque'
    | 'Classical'
    | 'Romantic'
    | 'Modern'
    | 'Contemporary'

export type ComposerPeriod = {
    id: ComposerPeriodId
    from: number
    to: number
}

/** Canonical era definitions — UI markers / quick-select; filtering uses numeric years. */
export const COMPOSER_PERIODS: readonly ComposerPeriod[] = [
    {id: 'Medieval', from: 500, to: 1400},
    {id: 'Renaissance', from: 1400, to: 1600},
    {id: 'Baroque', from: 1600, to: 1750},
    {id: 'Classical', from: 1750, to: 1820},
    {id: 'Romantic', from: 1820, to: 1900},
    {id: 'Modern', from: 1900, to: 2000},
    {id: 'Contemporary', from: 2000, to: COMPOSER_YEAR_MAX},
] as const

export const COMPOSER_YEAR_MARKERS = [500, 1400, 1600, 1750, 1820, 1900, 2000, COMPOSER_YEAR_MAX] as const

export function periodAtYear(year: number): ComposerPeriod {
    for (let i = 0; i < COMPOSER_PERIODS.length; i++) {
        const period = COMPOSER_PERIODS[i]
        const isLast = i === COMPOSER_PERIODS.length - 1
        if (isLast ? year >= period.from && year <= period.to : year >= period.from && year < period.to) {
            return period
        }
    }
    return COMPOSER_PERIODS[COMPOSER_PERIODS.length - 1]
}

export function periodsInRange(from: number, to: number): ComposerPeriod[] {
    const lo = Math.min(from, to)
    const hi = Math.max(from, to)
    return COMPOSER_PERIODS.filter(period => lo <= period.to && hi >= period.from)
}

export function shortPeriodLabel(fullLabel: string) {
    return fullLabel.replace(/\s*\([^)]*\)\s*$/, '').trim()
}
