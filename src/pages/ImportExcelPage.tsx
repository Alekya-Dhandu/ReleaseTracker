import { Alert, Button, Card, CardContent, Stack, Typography, CircularProgress, LinearProgress, Box } from '@mui/material'
import React from 'react'
import * as XLSX from 'xlsx'
import type { ReleaseTrackerData, PlatformVersionRow, ReleaseTrackerRow, DeviceMatrixRow, ApiCompatibilityRow, NextReleaseDeploymentRow } from '../data/models'
import { useReleaseData } from '../data/useReleaseData'
import { resetData, saveData } from '../data/storage'
import { PageHeader } from './components/PageHeader'

function normalizeHeader(s: unknown) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function normalizeRow(row: Record<string, unknown>, mapping: Record<string, string>) {
  const normalized: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    // First try exact match
    let key = mapping[k]
    if (!key) {
      // Try case-insensitive match
      const lowerKey = k.toLowerCase()
      key = mapping[lowerKey]
    }
    if (!key) {
      // Try normalized match (remove spaces, special chars)
      const normalizedKey = k.toLowerCase().replace(/[^a-z0-9]/g, '')
      key = mapping[normalizedKey]
    }
    if (!key) {
      // Fallback to normalized version of the original key
      key = k.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
    }
    normalized[key] = v
  }
  return normalized
}

function sheetToObjects(ws: XLSX.WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false })
  return rows
}

const releaseTrackerMapping: Record<string, string> = {
  'Date': 'date',
  'Client': 'client',
  'Platform': 'platform',
  'Repo': 'repo',
  'Branch': 'branch',
  'Commit Id': 'commitId',
  'Status': 'status',
  'Environment': 'environment',
  'Blocker': 'blocker',
  'Feature Impacted': 'featureImpacted',
  'Notes': 'notes',
  // Case variations
  'date': 'date',
  'client': 'client',
  'platform': 'platform',
  'repo': 'repo',
  'branch': 'branch',
  'commit id': 'commitId',
  'status': 'status',
  'environment': 'environment',
  'blocker': 'blocker',
  'feature impacted': 'featureImpacted',
  'notes': 'notes'
}

const platformVersionsMapping: Record<string, string> = {
  'Component': 'component',
  'Client': 'client',
  'Type': 'type',
  'Platform': 'type', // Alternative mapping for Excel files that use "Platform" instead of "Type"
  'Prod Version': 'prodVersion',
  'Previous Version': 'previousVersion',
  'Branch': 'branch',
  'Last Release Date': 'lastReleaseDate',
  'API Version': 'apiVersion',
  'Owner': 'owner',
  'Store Status': 'storeStatus',
  'Notes': 'notes',
  // Case variations
  'component': 'component',
  'client': 'client',
  'type': 'type',
  'platform': 'type',
  'prod version': 'prodVersion',
  'previous version': 'previousVersion',
  'branch': 'branch',
  'last release date': 'lastReleaseDate',
  'api version': 'apiVersion',
  'owner': 'owner',
  'store status': 'storeStatus',
  'notes': 'notes'
}

const apiCompatibilityMapping: Record<string, string> = {
  'API Version': 'apiVersion',
  'Breaking': 'breaking',
  'Release Date': 'releaseDate',
  'Used By Platforms': 'usedByPlatforms',
  'Blocked Platforms': 'blockedPlatforms',
  'Notes': 'notes',
  // Case variations
  'api version': 'apiVersion',
  'breaking': 'breaking',
  'release date': 'releaseDate',
  'used by platforms': 'usedByPlatforms',
  'blocked platforms': 'blockedPlatforms',
  'notes': 'notes'
}

const nextReleaseDeploymentsMapping: Record<string, string> = {
  'Date': 'date',
  'Client': 'client',
  'Platform': 'platform',
  'Branch': 'branch',
  'Env': 'env',
  'Features': 'features',
  'Status': 'status',
  'Owner': 'owner',
  'Prod Release Date': 'prodReleaseDate',
  'Build Links': 'buildLinks',
  // Case variations
  'date': 'date',
  'client': 'client',
  'platform': 'platform',
  'branch': 'branch',
  'env': 'env',
  'features': 'features',
  'status': 'status',
  'owner': 'owner',
  'prod release date': 'prodReleaseDate',
  'build links': 'buildLinks'
}

export function ImportExcelPage() {
  const { data, setData } = useReleaseData()
  const [message, setMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isImporting, setIsImporting] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [progressText, setProgressText] = React.useState('')

  const onPick = async (file: File) => {
    setError(null)
    setMessage(null)
    setIsImporting(true)
    setProgress(0)
    setProgressText('Reading Excel file...')

    try {
      const buf = await file.arrayBuffer()
      setProgress(20)
      setProgressText('Parsing workbook...')

      const wb = XLSX.read(buf)
      setProgress(40)
      setProgressText('Processing sheets...')

      const byName = new Map<string, string>()
      for (const n of wb.SheetNames) byName.set(normalizeHeader(n), n)

      const getSheet = (name: string) => {
        const exact = byName.get(normalizeHeader(name))
        if (!exact) return null
        return wb.Sheets[exact] ?? null
      }

      // Expected names from your screenshots:
      // - "01_Platform_Versions" / "TVAAS Platform versions"
      // - "04_Release_Tracker"
      // - "02_Feature_Device_Matrix"
      // - "03_API_Compatibility"
      // - "Next-Release deployments"
      const platformSheet =
        getSheet('01_Platform_Versions') ?? getSheet('platform versions') ?? getSheet('tvaas platform versions')
      const releaseTrackerSheet = getSheet('04_Release_Tracker') ?? getSheet('release tracker')
      const deviceMatrixSheet = getSheet('02_Feature_Device_Matrix') ?? getSheet('feature_device_matrix')
      const apiCompatSheet = getSheet('03_API_Compatibility') ?? getSheet('api_compatibility')
      const nextReleaseSheet = getSheet('Next-Release deployments') ?? getSheet('next-release deployments')

      setProgress(60)
      setProgressText('Converting data...')

      let deviceMatrixRows: DeviceMatrixRow[] = data.deviceMatrix
      if (deviceMatrixSheet) {
        const matrixRows = sheetToObjects(deviceMatrixSheet)
        // Platform columns as per screenshot
        const platformCols = [
          'Android Mobile', 'Android TV', 'Fire TV', 'iOS Mobile', 'Apple TV', 'Web', 'Roku', 'LG', 'Samsung'
        ]
        deviceMatrixRows = []
        for (const row of matrixRows) {
          for (const platform of platformCols) {
            if (row[platform] !== undefined) {
              deviceMatrixRows.push({
                client: String(row['Customer'] || ''),
                platformOrDevice: platform,
                newVersion: String(row['Feature'] || ''),
                status: String(row[platform] || ''),
                owner: '',
                updatedAt: new Date().toISOString(),
              })
            }
          }
        }
      }

      setProgress(80)
      setProgressText('Saving data...')

      const next: ReleaseTrackerData = {
        platformVersions: platformSheet ? (sheetToObjects(platformSheet).map(r => ({ ...normalizeRow(r, platformVersionsMapping), updatedAt: new Date().toISOString() } as PlatformVersionRow))) : data.platformVersions,
        releaseTracker: releaseTrackerSheet ? (sheetToObjects(releaseTrackerSheet).map(r => ({ ...normalizeRow(r, releaseTrackerMapping), updatedAt: new Date().toISOString() } as ReleaseTrackerRow))) : data.releaseTracker,
        deviceMatrix: deviceMatrixRows.map(row => ({ ...row, updatedAt: new Date().toISOString() })),
        apiCompatibility: apiCompatSheet ? (sheetToObjects(apiCompatSheet).map(r => ({ ...normalizeRow(r, apiCompatibilityMapping), updatedAt: new Date().toISOString() } as ApiCompatibilityRow))) : data.apiCompatibility,
        nextReleaseDeployments: nextReleaseSheet ? (sheetToObjects(nextReleaseSheet).map(r => ({ ...normalizeRow(r, nextReleaseDeploymentsMapping), updatedAt: new Date().toISOString() } as NextReleaseDeploymentRow))) : data.nextReleaseDeployments,
        updatedAt: new Date().toISOString(),
      }

      setData(next)
      saveData(next)

      setProgress(100)
      setProgressText('Import complete!')

      const imported = [
        platformSheet ? 'Platform Versions' : null,
        releaseTrackerSheet ? 'Release Tracker' : null,
        deviceMatrixSheet ? 'Feature/Device Matrix' : null,
        apiCompatSheet ? 'API Compatibility' : null,
        nextReleaseSheet ? 'Next Release Deployments' : null,
      ].filter(Boolean)

      setMessage(imported.length ? `Successfully imported: ${imported.join(', ')}` : 'No matching sheets found; kept existing data.')

      // Reset progress after a short delay
      setTimeout(() => {
        setIsImporting(false)
        setProgress(0)
        setProgressText('')
      }, 2000)

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to import file')
      setIsImporting(false)
      setProgress(0)
      setProgressText('')
    }
  }

  return (
    <Stack gap={2}>
      <PageHeader title="Import Excel" subtitle="Upload your release master workbook (XLSX). The app will load matching sheets." />

      {isImporting && (
        <Card>
          <CardContent>
            <Stack gap={2} alignItems="center">
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={24} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {progressText}
                  </Typography>
                  <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {message && !isImporting ? <Alert severity="success">{message}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <CardContent>
          <Stack gap={1.5}>
            <Button
              variant="contained"
              component="label"
              disabled={isImporting}
              startIcon={isImporting ? <CircularProgress size={16} /> : null}
            >
              {isImporting ? 'Importing...' : 'Choose Excel file'}
              <input
                hidden
                type="file"
                accept=".xlsx,.xls"
                disabled={isImporting}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void onPick(f)
                }}
              />
            </Button>

            <Typography variant="body2" color="text.secondary">
              Tip: Keep sheet names as in your workbook (ex: <b>04_Release_Tracker</b>, <b>03_API_Compatibility</b>,{' '}
              <b>02_Feature_Device_Matrix</b>).
            </Typography>

            <Button
              variant="outlined"
              color="inherit"
              disabled={isImporting}
              onClick={() => {
                resetData()
                window.location.reload()
              }}
            >
              Reset to sample data
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

