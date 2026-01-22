import { useState } from 'react';
import { Box, Toolbar, CssBaseline, useMediaQuery, useTheme } from '@mui/material';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(true);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const drawerWidth = open ? 240 : 72;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <TopBar onMenuClick={toggleDrawer} />
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          backgroundColor: '#1F1F1F',
          minHeight: '100vh',
          marginLeft: isMobile ? 0 : 0,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
