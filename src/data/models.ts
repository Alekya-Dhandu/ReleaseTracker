export type PlatformVersionRow = {
  component: string
  client: string
  type: string
  prodVersion: string
  previousVersion?: string
  branch?: string
  lastReleaseDate?: string
  apiVersion?: string
  owner?: string
  storeStatus?: string
  notes?: string
  updatedAt?: string
}

export type ReleaseTrackerRow = {
  date?: string
  client: string
  platform: string
  repo?: string
  branch?: string
  commitId?: string
  status?: string
  environment?: string
  blocker?: string
  featureImpacted?: string
  notes?: string
  updatedAt?: string
}

export type DeviceMatrixRow = {
  client: string
  layer?: string
  platformOrDevice: string
  newVersion?: string
  oldVersion?: string
  branchOrTag?: string
  lastReleaseDate?: string
  appLineBuildNumber?: string
  appBuildVersionOrVersionCode?: string
  status?: string
  owner?: string
  tenant?: string
  buildLinks?: string
  updatedAt?: string
}

export type ApiCompatibilityRow = {
  apiVersion: string
  breaking?: 'yes' | 'no' | string
  releaseDate?: string
  usedByPlatforms?: string
  blockedPlatforms?: string
  notes?: string
  updatedAt?: string
}

export type NextReleaseDeploymentRow = {
  date?: string
  client: string
  platform: string
  branch?: string
  env?: string
  features?: string
  status?: string
  owner?: string
  prodReleaseDate?: string
  buildLinks?: string
  updatedAt?: string
}

export type ReleaseTrackerData = {
  platformVersions: PlatformVersionRow[]
  releaseTracker: ReleaseTrackerRow[]
  deviceMatrix: DeviceMatrixRow[]
  apiCompatibility: ApiCompatibilityRow[]
  nextReleaseDeployments: NextReleaseDeploymentRow[]
  updatedAt?: string
}

