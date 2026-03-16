import type { ReleaseTrackerData } from './models'
import { sampleData } from './sampleData'

const STORAGE_KEY = 'release-tracker:data:v1'

export function loadData(): ReleaseTrackerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return sampleData
    return JSON.parse(raw) as ReleaseTrackerData
  } catch {
    return sampleData
  }
}

export function saveData(data: ReleaseTrackerData) {
  const next: ReleaseTrackerData = { ...data, updatedAt: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function resetData() {
  localStorage.removeItem(STORAGE_KEY)
}

