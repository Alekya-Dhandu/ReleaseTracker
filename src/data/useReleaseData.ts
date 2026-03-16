import React from 'react'
import type { ReleaseTrackerData } from './models'
import { loadData, saveData } from './storage'

export function useReleaseData() {
  const [data, setData] = React.useState<ReleaseTrackerData>(() => loadData())

  const update = React.useCallback((updater: (prev: ReleaseTrackerData) => ReleaseTrackerData) => {
    setData((prev) => {
      const next = updater(prev)
      saveData(next)
      return next
    })
  }, [])

  return { data, setData, update }
}

