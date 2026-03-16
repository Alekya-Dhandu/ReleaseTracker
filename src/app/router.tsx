import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { AppShell } from '../layout/AppShell'
import { DashboardPage } from '../pages/DashboardPage'
import { PlatformVersionsPage } from '../pages/PlatformVersionsPage'
import { ReleaseTrackerPage } from '../pages/ReleaseTrackerPage'
import { DeviceMatrixPage } from '../pages/DeviceMatrixPage'
import { ApiCompatibilityPage } from '../pages/ApiCompatibilityPage'
import { NextReleaseDeploymentsPage } from '../pages/NextReleaseDeploymentsPage'
import { ImportExcelPage } from '../pages/ImportExcelPage'

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})

const platformVersionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/platform-versions',
  component: PlatformVersionsPage,
})

const releaseTrackerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/release-tracker',
  component: ReleaseTrackerPage,
})

const deviceMatrixRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/device-matrix',
  component: DeviceMatrixPage,
})

const apiCompatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/api-compatibility',
  component: ApiCompatibilityPage,
})

const nextReleaseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/next-release',
  component: NextReleaseDeploymentsPage,
})

const importExcelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/import',
  component: ImportExcelPage,
})

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  platformVersionsRoute,
  releaseTrackerRoute,
  deviceMatrixRoute,
  apiCompatRoute,
  nextReleaseRoute,
  importExcelRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

