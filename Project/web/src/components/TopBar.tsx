import { AppBar, Toolbar, IconButton, Box, Avatar, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoImage from '../assets/logo_white.png';

interface TopBarProps {
  onMenuClick: () => void;
}

const TopBar = ({ onMenuClick }: TopBarProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        background: theme.palette.background.paper,
        boxShadow: 'none',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar 
        sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        {/* Left side - Menu button and Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ 
              mr: { xs: 1, sm: 2 },
              borderRadius: 2,
              '&:hover': {
                background: 'rgba(255, 0, 0, 0.08)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box
            component="img"
            src={LogoImage} 
            alt="AllInOne Converter" 
            sx={{ 
              height: { xs: 20, sm: 24 },
              objectFit: 'contain',
            }} 
          />
        </Box>

        {/* Spacer - takes remaining space */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Right side - Avatar (always visible on the right edge) */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <IconButton 
            sx={{ 
              p: 0.5,
              borderRadius: 2,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <Avatar 
              alt="User" 
              src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
              sx={{ 
                width: 32, 
                height: 32,
                border: '2px solid rgba(255, 0, 0, 0.3)',
              }}
            />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
