import 'server-only'

export type Work = {
  workId: number
  catalogue: string
  number: string
  title: string
  composer: string
  type: string
  key: string
  instrumentation: string
}

export type WorkFilters = {
  search?: string
  catalogue?: string
  type?: string
  key?: string
  instrumentation?: string
}

export type WorkFilterOptions = Record<Exclude<keyof WorkFilters, 'search'>, string[]>

function clean(value?: string) {
  return value?.trim() || undefined
}

export async function getWorks(filters: WorkFilters = {}): Promise<Work[]> {
  // Placeholder - will be populated from static data later
  return []
}

export async function getWorkFilterOptions(): Promise<WorkFilterOptions> {
  return {
    catalogue: [],
    type: [],
    key: [],
    instrumentation: [],
  }
}
