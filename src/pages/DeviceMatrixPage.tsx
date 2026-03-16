import { Card, CardContent, Stack, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import { createColumnHelper } from '@tanstack/react-table'
import React from 'react'
import type { DeviceMatrixRow } from '../data/models'
import { useReleaseData } from '../data/useReleaseData'
import { DataTable } from './components/DataTable'
import { PageHeader } from './components/PageHeader'

const col = createColumnHelper<DeviceMatrixRow>()

export function DeviceMatrixPage() {
  const { data, update } = useReleaseData()
  const [q, setQ] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [newRow, setNewRow] = React.useState<Partial<DeviceMatrixRow>>({})
  const [editing, setEditing] = React.useState<DeviceMatrixRow | null>(null)

  const handleAdd = () => {
    if (newRow.client && newRow.platformOrDevice) {
      const rowWithTimestamp = { ...newRow, updatedAt: new Date().toISOString() }
      if (editing) {
        update(prev => ({ ...prev, deviceMatrix: prev.deviceMatrix.map(r => r === editing ? rowWithTimestamp as DeviceMatrixRow : r) }))
      } else {
        update(prev => ({ ...prev, deviceMatrix: [...prev.deviceMatrix, rowWithTimestamp as DeviceMatrixRow] }))
      }
      setNewRow({})
      setEditing(null)
      setOpen(false)
    }
  }

  const handleEdit = (row: DeviceMatrixRow) => {
    setNewRow(row)
    setEditing(row)
    setOpen(true)
  }

  const handleDelete = (row: DeviceMatrixRow) => {
    if (confirm('Delete this entry?')) {
      update(prev => ({ ...prev, deviceMatrix: prev.deviceMatrix.filter(r => r !== row) }))
    }
  }

  const columns = [
    col.accessor('client', { header: 'Client', cell: (c) => c.getValue() }),
    col.accessor('layer', { header: 'Layer', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('platformOrDevice', { header: 'Platform / Device', cell: (c) => c.getValue() }),
    col.accessor('newVersion', { header: 'New Version', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('oldVersion', { header: 'Old Version', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('branchOrTag', { header: 'Branch / Tag', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('lastReleaseDate', { header: 'Last Release Date', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('status', { header: 'Status', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('owner', { header: 'Owner', cell: (c) => c.getValue() ?? '—' }),
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
    if (!needle) return data.deviceMatrix
    return data.deviceMatrix.filter((r) =>
      [r.client, r.layer, r.platformOrDevice, r.newVersion, r.oldVersion, r.branchOrTag, r.status, r.owner]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [data.deviceMatrix, q])

  return (
    <Stack gap={2}>
      <PageHeader title="Feature / Device Matrix" subtitle="Equivalent to your “Feature_Device_Matrix” sheet." />
      <Card>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Client, platform/device, versions, owner…"
          />
        </CardContent>
      </Card>
      <Button variant="contained" onClick={() => setOpen(true)}>Add New Entry</Button>
      <DataTable data={filtered} columns={columns} />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit' : 'Add New'} Device Matrix Entry</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField label="Client" required value={newRow.client || ''} onChange={(e) => setNewRow({ ...newRow, client: e.target.value })} />
            <TextField label="Layer" value={newRow.layer || ''} onChange={(e) => setNewRow({ ...newRow, layer: e.target.value })} />
            <TextField label="Platform / Device" required value={newRow.platformOrDevice || ''} onChange={(e) => setNewRow({ ...newRow, platformOrDevice: e.target.value })} />
            <TextField label="New Version" value={newRow.newVersion || ''} onChange={(e) => setNewRow({ ...newRow, newVersion: e.target.value })} />
            <TextField label="Old Version" value={newRow.oldVersion || ''} onChange={(e) => setNewRow({ ...newRow, oldVersion: e.target.value })} />
            <TextField label="Branch / Tag" value={newRow.branchOrTag || ''} onChange={(e) => setNewRow({ ...newRow, branchOrTag: e.target.value })} />
            <TextField label="Last Release Date" value={newRow.lastReleaseDate || ''} onChange={(e) => setNewRow({ ...newRow, lastReleaseDate: e.target.value })} />
            <TextField label="App Line Build Number" value={newRow.appLineBuildNumber || ''} onChange={(e) => setNewRow({ ...newRow, appLineBuildNumber: e.target.value })} />
            <TextField label="App Build Version / Version Code" value={newRow.appBuildVersionOrVersionCode || ''} onChange={(e) => setNewRow({ ...newRow, appBuildVersionOrVersionCode: e.target.value })} />
            <TextField label="Status" value={newRow.status || ''} onChange={(e) => setNewRow({ ...newRow, status: e.target.value })} />
            <TextField label="Owner" value={newRow.owner || ''} onChange={(e) => setNewRow({ ...newRow, owner: e.target.value })} />
            <TextField label="Tenant" value={newRow.tenant || ''} onChange={(e) => setNewRow({ ...newRow, tenant: e.target.value })} />
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

