import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import { Link, useRouterState } from '@tanstack/react-router'
import React from 'react'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import DeviceHubOutlinedIcon from '@mui/icons-material/DeviceHubOutlined'
import PublishedWithChangesOutlinedIcon from '@mui/icons-material/PublishedWithChangesOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined'

const drawerWidth = 260

type NavItem = {
  to: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <DashboardOutlinedIcon /> },
  { to: '/platform-versions', label: 'Platform Versions', icon: <PublishedWithChangesOutlinedIcon /> },
  { to: '/release-tracker', label: 'Release Tracker', icon: <TableChartOutlinedIcon /> },
  { to: '/device-matrix', label: 'Feature/Device Matrix', icon: <DeviceHubOutlinedIcon /> },
  { to: '/api-compatibility', label: 'API Compatibility', icon: <TableChartOutlinedIcon /> },
  { to: '/next-release', label: 'Next Release Deployments', icon: <TableChartOutlinedIcon /> },
  { to: '/import', label: 'Import Excel', icon: <UploadFileOutlinedIcon /> },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.4 }}>
          Release Tracker
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track versions across platforms/devices
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1, py: 1 }}>
        {navItems.map((item) => {
          const selected = pathname === item.to
          return (
            <ListItemButton
              key={item.to}
              component={Link}
              to={item.to}
              selected={selected}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(31,78,121,0.10)',
                  '&:hover': { bgcolor: 'rgba(31,78,121,0.14)' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: selected ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
            </ListItemButton>
          )
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button fullWidth variant="outlined" size="small" component={Link} to="/import">
          Import latest Excel
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100svh' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen((v) => !v)}
            sx={{ display: { md: 'none' } }}
            aria-label="open navigation"
          >
            <MenuOutlinedIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {navItems.find((n) => n.to === pathname)?.label ?? 'Dashboard'}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="navigation">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 2.5, mt: 8 }}>
        {children}
      </Box>
    </Box>
  )
}

