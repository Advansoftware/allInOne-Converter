import { createTheme } from '@mui/material/styles';

// Vermelho YouTube: #FF0000
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF0000',
      contrastText: '#fff',
    },
    secondary: {
      main: '#232323',
    },
    background: {
      default: '#181A20',
      paper: '#23242b',
    },
    text: {
      primary: '#fff',
      secondary: '#aaa',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
});

export default theme;
