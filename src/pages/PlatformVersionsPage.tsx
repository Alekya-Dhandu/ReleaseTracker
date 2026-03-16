import { Card, CardContent, Stack, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import { createColumnHelper } from '@tanstack/react-table'
import React from 'react'
import type { PlatformVersionRow } from '../data/models'
import { useReleaseData } from '../data/useReleaseData'
import { DataTable } from './components/DataTable'
import { PageHeader } from './components/PageHeader'

const col = createColumnHelper<PlatformVersionRow>()

export function PlatformVersionsPage() {
  const { data, update } = useReleaseData()
  const [q, setQ] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [newRow, setNewRow] = React.useState<Partial<PlatformVersionRow>>({})
  const [editing, setEditing] = React.useState<PlatformVersionRow | null>(null)

  const handleAdd = () => {
    if (newRow.component && newRow.client) {
      const rowWithTimestamp = { ...newRow, updatedAt: new Date().toISOString() }
      if (editing) {
        update(prev => ({ ...prev, platformVersions: prev.platformVersions.map(r => r === editing ? rowWithTimestamp as PlatformVersionRow : r) }))
      } else {
        update(prev => ({ ...prev, platformVersions: [...prev.platformVersions, rowWithTimestamp as PlatformVersionRow] }))
      }
      setNewRow({})
      setEditing(null)
      setOpen(false)
    }
  }

  const handleEdit = (row: PlatformVersionRow) => {
    setNewRow(row)
    setEditing(row)
    setOpen(true)
  }

  const handleDelete = (row: PlatformVersionRow) => {
    if (confirm('Delete this entry?')) {
      update(prev => ({ ...prev, platformVersions: prev.platformVersions.filter(r => r !== row) }))
    }
  }

  const columns = [
    col.accessor('component', { header: 'Component', cell: (c) => c.getValue() }),
    col.accessor('client', { header: 'Client', cell: (c) => c.getValue() }),
    col.accessor('type', { header: 'Platform', cell: (c) => c.getValue() }),
    col.accessor('prodVersion', { header: 'Prod Version', cell: (c) => c.getValue() }),
    col.accessor('previousVersion', { header: 'Previous Version', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('branch', { header: 'Branch', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('lastReleaseDate', { header: 'Last Release Date', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('apiVersion', { header: 'API Version', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('owner', { header: 'Owner', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('storeStatus', { header: 'Store Status', cell: (c) => c.getValue() ?? '—' }),
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
    if (!needle) return data.platformVersions
    return data.platformVersions.filter((r) =>
      [r.component, r.client, r.type, r.prodVersion, r.branch, r.owner, r.storeStatus]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [data.platformVersions, q])

  return (
    <Stack gap={2}>
      <PageHeader title="Platform Versions" subtitle="Equivalent to your “Platform versions” Excel sheet." />
      <Card>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Client, component, type, version, branch…"
          />
        </CardContent>
      </Card>
      <Button variant="contained" onClick={() => setOpen(true)}>Add New Entry</Button>
      <DataTable data={filtered} columns={columns} />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit' : 'Add New'} Platform Version Entry</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField label="Component" required value={newRow.component || ''} onChange={(e) => setNewRow({ ...newRow, component: e.target.value })} />
            <TextField label="Client" required value={newRow.client || ''} onChange={(e) => setNewRow({ ...newRow, client: e.target.value })} />
            <TextField label="Type" value={newRow.type || ''} onChange={(e) => setNewRow({ ...newRow, type: e.target.value })} />
            <TextField label="Prod Version" value={newRow.prodVersion || ''} onChange={(e) => setNewRow({ ...newRow, prodVersion: e.target.value })} />
            <TextField label="Previous Version" value={newRow.previousVersion || ''} onChange={(e) => setNewRow({ ...newRow, previousVersion: e.target.value })} />
            <TextField label="Branch" value={newRow.branch || ''} onChange={(e) => setNewRow({ ...newRow, branch: e.target.value })} />
            <TextField label="Last Release Date" value={newRow.lastReleaseDate || ''} onChange={(e) => setNewRow({ ...newRow, lastReleaseDate: e.target.value })} />
            <TextField label="API Version" value={newRow.apiVersion || ''} onChange={(e) => setNewRow({ ...newRow, apiVersion: e.target.value })} />
            <TextField label="Owner" value={newRow.owner || ''} onChange={(e) => setNewRow({ ...newRow, owner: e.target.value })} />
            <TextField label="Store Status" value={newRow.storeStatus || ''} onChange={(e) => setNewRow({ ...newRow, storeStatus: e.target.value })} />
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

