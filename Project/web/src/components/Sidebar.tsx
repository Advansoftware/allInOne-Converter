import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Box, 
  useMediaQuery, 
  useTheme,
  Tooltip,
  Typography
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

const drawerWidth = 256;
const railWidth = 80;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { icon: <DashboardIcon />, label: 'Dashboard', active: true },
    { icon: <VideoLibraryIcon />, label: 'Conteúdo', active: false },
  ];

  const isExpanded = isMobile || open;
  const currentWidth = isMobile ? drawerWidth : (open ? drawerWidth : railWidth);

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? open : true}
      onClose={onClose}
      disableScrollLock={true}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
        disableScrollLock: true,
      }}
      sx={{
        width: currentWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: currentWidth, 
          boxSizing: 'border-box',
          overflowX: 'hidden',
          overflowY: 'hidden',
          border: 'none',
          background: theme.palette.background.paper,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.easeInOut,
            duration: 280,
          }),
        },
      }}
    >
      <Toolbar />
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          pt: 2,
          px: isExpanded ? 1.5 : 0,
        }}
      >
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {menuItems.map((item, index) => {
            const buttonContent = (
              <ListItem 
                key={index} 
                disablePadding 
                sx={{ 
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <ListItemButton
                  sx={{
                    minHeight: isExpanded ? 48 : 56,
                    flexDirection: isExpanded ? 'row' : 'column',
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    alignItems: 'center',
                    px: isExpanded ? 2.5 : 0,
                    py: isExpanded ? 1 : 1.5,
                    mx: isExpanded ? 0 : 1.5,
                    borderRadius: isExpanded ? 6 : 4,
                    gap: isExpanded ? 0 : 0.5,
                    width: isExpanded ? '100%' : 56,
                    background: item.active 
                      ? 'rgba(255, 0, 0, 0.15)' 
                      : 'transparent',
                    '&:hover': {
                      background: item.active 
                        ? 'rgba(255, 0, 0, 0.22)' 
                        : 'rgba(255, 255, 255, 0.08)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isExpanded ? 2.5 : 0,
                      justifyContent: 'center',
                      color: item.active ? '#FF0000' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  
                  {isExpanded ? (
                    <ListItemText 
                      primary={item.label} 
                      sx={{ 
                        m: 0,
                        '& .MuiTypography-root': {
                          fontWeight: item.active ? 600 : 400,
                          fontSize: 14,
                          color: item.active ? '#fff' : 'rgba(255,255,255,0.7)',
                        },
                      }} 
                    />
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: 10,
                        fontWeight: item.active ? 600 : 400,
                        color: item.active ? '#fff' : 'rgba(255,255,255,0.6)',
                        textAlign: 'center',
                        lineHeight: 1.2,
                        mt: 0.25,
                      }}
                    >
                      {item.label}
                    </Typography>
                  )}
                </ListItemButton>
              </ListItem>
            );

            return buttonContent;
          })}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
