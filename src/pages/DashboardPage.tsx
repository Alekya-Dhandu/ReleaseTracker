import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import React from 'react'
import { useReleaseData } from '../data/useReleaseData'

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { data } = useReleaseData()

  return (
    <Stack gap={2.5}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
        }}
      >
        <Box>
          <StatCard label="Platform Versions rows" value={data.platformVersions.length} />
        </Box>
        <Box>
          <StatCard label="Release Tracker rows" value={data.releaseTracker.length} />
        </Box>
        <Box>
          <StatCard label="Device Matrix rows" value={data.deviceMatrix.length} />
        </Box>
        <Box>
          <StatCard label="API Compatibility rows" value={data.apiCompatibility.length} />
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            What this app solves
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <li>
              <Typography variant="body2" color="text.secondary">
                One source of truth for app versions across devices and platforms.
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                Quickly spot mismatched versions (same app published as different versions on different devices).
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                Import your existing Excel master and then automate updates via CI/CD.
              </Typography>
            </li>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Last updated: {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : '—'}
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  )
}

