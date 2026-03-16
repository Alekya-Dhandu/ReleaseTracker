import { Card, CardContent, Stack, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import { createColumnHelper } from '@tanstack/react-table'
import React from 'react'
import type { NextReleaseDeploymentRow } from '../data/models'
import { useReleaseData } from '../data/useReleaseData'
import { DataTable } from './components/DataTable'
import { PageHeader } from './components/PageHeader'

const col = createColumnHelper<NextReleaseDeploymentRow>()

export function NextReleaseDeploymentsPage() {
  const { data, update } = useReleaseData()
  const [q, setQ] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [newRow, setNewRow] = React.useState<Partial<NextReleaseDeploymentRow>>({})
  const [editing, setEditing] = React.useState<NextReleaseDeploymentRow | null>(null)

  const handleAdd = () => {
    if (newRow.client && newRow.platform) {
      const rowWithTimestamp = { ...newRow, updatedAt: new Date().toISOString() }
      if (editing) {
        update(prev => ({ ...prev, nextReleaseDeployments: prev.nextReleaseDeployments.map(r => r === editing ? rowWithTimestamp as NextReleaseDeploymentRow : r) }))
      } else {
        update(prev => ({ ...prev, nextReleaseDeployments: [...prev.nextReleaseDeployments, rowWithTimestamp as NextReleaseDeploymentRow] }))
      }
      setNewRow({})
      setEditing(null)
      setOpen(false)
    }
  }

  const handleEdit = (row: NextReleaseDeploymentRow) => {
    setNewRow(row)
    setEditing(row)
    setOpen(true)
  }

  const handleDelete = (row: NextReleaseDeploymentRow) => {
    if (confirm('Delete this entry?')) {
      update(prev => ({ ...prev, nextReleaseDeployments: prev.nextReleaseDeployments.filter(r => r !== row) }))
    }
  }

  const columns = [
    col.accessor('date', { header: 'Date', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('client', { header: 'Client', cell: (c) => c.getValue() }),
    col.accessor('platform', { header: 'Platform', cell: (c) => c.getValue() }),
    col.accessor('branch', { header: 'Branch', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('env', { header: 'Env', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('features', { header: 'Features', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('status', { header: 'Status', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('owner', { header: 'Owner', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('prodReleaseDate', { header: 'Prod Release Date', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('buildLinks', { header: 'Build Links', cell: (c) => c.getValue() ?? '—' }),
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
    if (!needle) return data.nextReleaseDeployments
    return data.nextReleaseDeployments.filter((r) =>
      [r.date, r.client, r.platform, r.branch, r.env, r.features, r.status, r.owner, r.prodReleaseDate, r.buildLinks]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [data.nextReleaseDeployments, q])

  return (
    <Stack gap={2}>
      <PageHeader title="Next Release Deployments" subtitle="Equivalent to your “Next-Release deployments” sheet." />
      <Card>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Client, platform, branch, env, status…"
          />
        </CardContent>
      </Card>
      <Button variant="contained" onClick={() => setOpen(true)}>Add New Entry</Button>
      <DataTable data={filtered} columns={columns} />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit' : 'Add New'} Next Release Deployment Entry</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField label="Date" value={newRow.date || ''} onChange={(e) => setNewRow({ ...newRow, date: e.target.value })} />
            <TextField label="Client" required value={newRow.client || ''} onChange={(e) => setNewRow({ ...newRow, client: e.target.value })} />
            <TextField label="Platform" required value={newRow.platform || ''} onChange={(e) => setNewRow({ ...newRow, platform: e.target.value })} />
            <TextField label="Branch" value={newRow.branch || ''} onChange={(e) => setNewRow({ ...newRow, branch: e.target.value })} />
            <TextField label="Env" value={newRow.env || ''} onChange={(e) => setNewRow({ ...newRow, env: e.target.value })} />
            <TextField label="Features" value={newRow.features || ''} onChange={(e) => setNewRow({ ...newRow, features: e.target.value })} />
            <TextField label="Status" value={newRow.status || ''} onChange={(e) => setNewRow({ ...newRow, status: e.target.value })} />
            <TextField label="Owner" value={newRow.owner || ''} onChange={(e) => setNewRow({ ...newRow, owner: e.target.value })} />
            <TextField label="Prod Release Date" value={newRow.prodReleaseDate || ''} onChange={(e) => setNewRow({ ...newRow, prodReleaseDate: e.target.value })} />
            <TextField label="Build Links" value={newRow.buildLinks || ''} onChange={(e) => setNewRow({ ...newRow, buildLinks: e.target.value })} />
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

