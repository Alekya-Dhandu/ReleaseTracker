import { Card, CardContent, Stack, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import { createColumnHelper } from '@tanstack/react-table'
import React from 'react'
import type { ReleaseTrackerRow } from '../data/models'
import { useReleaseData } from '../data/useReleaseData'
import { DataTable } from './components/DataTable'
import { PageHeader } from './components/PageHeader'

const col = createColumnHelper<ReleaseTrackerRow>()

export function ReleaseTrackerPage() {
  const { data, update } = useReleaseData()
  const [q, setQ] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [newRow, setNewRow] = React.useState<Partial<ReleaseTrackerRow>>({})
  const [editing, setEditing] = React.useState<ReleaseTrackerRow | null>(null)

  const handleAdd = () => {
    if (newRow.client && newRow.platform) {
      const rowWithTimestamp = { ...newRow, updatedAt: new Date().toISOString() }
      if (editing) {
        update(prev => ({ ...prev, releaseTracker: prev.releaseTracker.map(r => r === editing ? rowWithTimestamp as ReleaseTrackerRow : r) }))
      } else {
        update(prev => ({ ...prev, releaseTracker: [...prev.releaseTracker, rowWithTimestamp as ReleaseTrackerRow] }))
      }
      setNewRow({})
      setEditing(null)
      setOpen(false)
    }
  }

  const handleEdit = (row: ReleaseTrackerRow) => {
    setNewRow(row)
    setEditing(row)
    setOpen(true)
  }

  const handleDelete = (row: ReleaseTrackerRow) => {
    if (confirm('Delete this entry?')) {
      update(prev => ({ ...prev, releaseTracker: prev.releaseTracker.filter(r => r !== row) }))
    }
  }

  const columns = [
    col.accessor('date', { header: 'Date', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('client', { header: 'Client', cell: (c) => c.getValue() }),
    col.accessor('platform', { header: 'Platform', cell: (c) => c.getValue() }),
    col.accessor('repo', { header: 'Repo', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('branch', { header: 'Branch', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('commitId', { header: 'Commit Id', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('status', { header: 'Status', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('environment', { header: 'Environment', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('blocker', { header: 'Blocker', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('featureImpacted', { header: 'Feature Impacted', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('updatedAt', { header: 'Updated', cell: (c) => c.getValue() ? new Date(c.getValue()!).toLocaleString() : '—' }),
    col.display({
      id: 'actions',
      header: 'Actions',
      cell: (c) => (
        <Stack direction="row">
          <IconButton onClick={() => handleEdit(c.row.original)}><Edit /></IconButton>
          <IconButton onClick={() => handleDelete(c.row.original)}><Delete /></IconButton>
        </Stack>
      ),
    }),
  ]

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return data.releaseTracker
    return data.releaseTracker.filter((r) =>
      [r.date, r.client, r.platform, r.repo, r.branch, r.commitId, r.status, r.environment, r.featureImpacted]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [data.releaseTracker, q])

  return (
    <Stack gap={2}>
      <PageHeader title="Release Tracker" subtitle="Equivalent to your “Release tracker” Excel sheet." />
      <Card>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Client, platform, repo, branch, status…"
          />
        </CardContent>
      </Card>
      <Button variant="contained" onClick={() => setOpen(true)}>Add New Entry</Button>
      <DataTable data={filtered} columns={columns} />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit' : 'Add New'} Release Tracker Entry</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField label="Date" value={newRow.date || ''} onChange={(e) => setNewRow({ ...newRow, date: e.target.value })} />
            <TextField label="Client" required value={newRow.client || ''} onChange={(e) => setNewRow({ ...newRow, client: e.target.value })} />
            <TextField label="Platform" required value={newRow.platform || ''} onChange={(e) => setNewRow({ ...newRow, platform: e.target.value })} />
            <TextField label="Repo" value={newRow.repo || ''} onChange={(e) => setNewRow({ ...newRow, repo: e.target.value })} />
            <TextField label="Branch" value={newRow.branch || ''} onChange={(e) => setNewRow({ ...newRow, branch: e.target.value })} />
            <TextField label="Commit Id" value={newRow.commitId || ''} onChange={(e) => setNewRow({ ...newRow, commitId: e.target.value })} />
            <TextField label="Status" value={newRow.status || ''} onChange={(e) => setNewRow({ ...newRow, status: e.target.value })} />
            <TextField label="Environment" value={newRow.environment || ''} onChange={(e) => setNewRow({ ...newRow, environment: e.target.value })} />
            <TextField label="Blocker" value={newRow.blocker || ''} onChange={(e) => setNewRow({ ...newRow, blocker: e.target.value })} />
            <TextField label="Feature Impacted" value={newRow.featureImpacted || ''} onChange={(e) => setNewRow({ ...newRow, featureImpacted: e.target.value })} />
            <TextField label="Notes" value={newRow.notes || ''} onChange={(e) => setNewRow({ ...newRow, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setEditing(null); setNewRow({}) }}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained">{editing ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

