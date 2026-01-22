import { createTheme } from '@mui/material/styles';

// Vermelho YouTube: #FF0000
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF0000', // Vermelho YouTube
      contrastText: '#fff',
    },
    secondary: {
      main: '#282828', // Surface element color (e.g. sidebar, cards)
    },
    background: {
      default: '#1F1F1F', // Fundo principal
      paper: '#282828',   // Fundo de elementos
    },
    text: {
      primary: '#fff',
      secondary: '#aaaaaa',
    },
    divider: '#3F3F3F',
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
    h5: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 700,
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Prevent body padding when modal opens
        body: {
          '&[style*="padding-right"]': {
            paddingRight: '0 !important',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#282828',
          backgroundImage: 'none',
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
          // Prevent AppBar from shifting when modal opens
          paddingRight: '0 !important',
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#282828',
          borderRight: '1px solid #3F3F3F',
        }
      }
    },
    MuiModal: {
      styleOverrides: {
        root: {
          // Don't add padding to compensate for scrollbar
          '& ~ .MuiAppBar-root': {
            paddingRight: '0 !important',
          },
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        // Disable padding compensation for scrollbar
        disableScrollLock: true,
      },
    },
  }
});

export default theme;
