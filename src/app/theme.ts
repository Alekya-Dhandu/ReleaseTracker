import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#e3f2fd',
      paper: '#ffffff',
    },
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#0d47a1',
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: ['"Segoe UI"', 'system-ui', 'Roboto', 'Arial', 'sans-serif'].join(','),
  },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid rgba(25,118,210,0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(25,118,210,0.08)',
          backgroundImage: 'none',
        },
      },
    },
  },
})

