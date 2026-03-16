import { Card, CardContent, Stack, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import { createColumnHelper } from '@tanstack/react-table'
import React from 'react'
import type { ApiCompatibilityRow } from '../data/models'
import { useReleaseData } from '../data/useReleaseData'
import { DataTable } from './components/DataTable'
import { PageHeader } from './components/PageHeader'

const col = createColumnHelper<ApiCompatibilityRow>()

export function ApiCompatibilityPage() {
  const { data, update } = useReleaseData()
  const [q, setQ] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [newRow, setNewRow] = React.useState<Partial<ApiCompatibilityRow>>({})
  const [editing, setEditing] = React.useState<ApiCompatibilityRow | null>(null)

  const handleAdd = () => {
    if (newRow.apiVersion) {
      const rowWithTimestamp = { ...newRow, updatedAt: new Date().toISOString() }
      if (editing) {
        update(prev => ({ ...prev, apiCompatibility: prev.apiCompatibility.map(r => r === editing ? rowWithTimestamp as ApiCompatibilityRow : r) }))
      } else {
        update(prev => ({ ...prev, apiCompatibility: [...prev.apiCompatibility, rowWithTimestamp as ApiCompatibilityRow] }))
      }
      setNewRow({})
      setEditing(null)
      setOpen(false)
    }
  }

  const handleEdit = (row: ApiCompatibilityRow) => {
    setNewRow(row)
    setEditing(row)
    setOpen(true)
  }

  const handleDelete = (row: ApiCompatibilityRow) => {
    if (confirm('Delete this entry?')) {
      update(prev => ({ ...prev, apiCompatibility: prev.apiCompatibility.filter(r => r !== row) }))
    }
  }

  const columns = [
    col.accessor('apiVersion', { header: 'API Version', cell: (c) => c.getValue() }),
    col.accessor('breaking', { header: 'Breaking (Yes/No)', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('releaseDate', { header: 'Release Date', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('usedByPlatforms', { header: 'Used By Platforms', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('blockedPlatforms', { header: 'Blocked Platforms', cell: (c) => c.getValue() ?? '—' }),
    col.accessor('notes', { header: 'Notes', cell: (c) => c.getValue() ?? '—' }),
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
    if (!needle) return data.apiCompatibility
    return data.apiCompatibility.filter((r) =>
      [r.apiVersion, r.breaking, r.releaseDate, r.usedByPlatforms, r.blockedPlatforms, r.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [data.apiCompatibility, q])

  return (
    <Stack gap={2}>
      <PageHeader title="API Compatibility" subtitle="Equivalent to your “API_Compatibility” sheet." />
      <Card>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="API version, used-by platforms, notes…"
          />
        </CardContent>
      </Card>
      <Button variant="contained" onClick={() => setOpen(true)}>Add New Entry</Button>
      <DataTable data={filtered} columns={columns} />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit' : 'Add New'} API Compatibility Entry</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField label="API Version" required value={newRow.apiVersion || ''} onChange={(e) => setNewRow({ ...newRow, apiVersion: e.target.value })} />
            <TextField label="Breaking" value={newRow.breaking || ''} onChange={(e) => setNewRow({ ...newRow, breaking: e.target.value })} />
            <TextField label="Release Date" value={newRow.releaseDate || ''} onChange={(e) => setNewRow({ ...newRow, releaseDate: e.target.value })} />
            <TextField label="Used By Platforms" value={newRow.usedByPlatforms || ''} onChange={(e) => setNewRow({ ...newRow, usedByPlatforms: e.target.value })} />
            <TextField label="Blocked Platforms" value={newRow.blockedPlatforms || ''} onChange={(e) => setNewRow({ ...newRow, blockedPlatforms: e.target.value })} />
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

