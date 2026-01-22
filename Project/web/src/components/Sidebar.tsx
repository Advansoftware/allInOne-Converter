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
  Typography,
  Divider,
  Badge,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 256;
const railWidth = 80;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  activeTorrents?: number;
}

const Sidebar = ({ open, onClose, activeTorrents = 0 }: SidebarProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: <DashboardIcon />, label: "Dashboard", path: "/" },
    { icon: <VideoLibraryIcon />, label: "Conteúdo", path: "/content" },
    {
      icon: (
        <Badge
          badgeContent={activeTorrents}
          color="error"
          invisible={activeTorrents === 0}
          sx={{
            "& .MuiBadge-badge": {
              fontSize: 10,
              height: 16,
              minWidth: 16,
              right: -3,
              top: 3,
            },
          }}
        >
          <CloudDownloadIcon />
        </Badge>
      ),
      label: "Torrents",
      path: "/torrents",
    },
  ];

  const bottomItems = [
    { icon: <SettingsIcon />, label: "Configurações", path: "/settings" },
  ];

  const isExpanded = isMobile || open;
  const currentWidth = isMobile ? drawerWidth : open ? drawerWidth : railWidth;

  const renderMenuItem = (item: any, index: number) => {
    const isActive = location.pathname === item.path;

    return (
      <ListItem
        key={index}
        disablePadding
        sx={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ListItemButton
          onClick={() => {
            navigate(item.path);
            if (isMobile) onClose();
          }}
          sx={{
            minHeight: isExpanded ? 48 : 56,
            flexDirection: isExpanded ? "row" : "column",
            justifyContent: isExpanded ? "flex-start" : "center",
            alignItems: "center",
            px: isExpanded ? 2.5 : 0,
            py: isExpanded ? 1 : 1.5,
            mx: isExpanded ? 0 : 1.5,
            borderRadius: isExpanded ? 6 : 4,
            gap: isExpanded ? 0 : 0.5,
            width: isExpanded ? "100%" : 56,
            background: isActive ? "rgba(255, 0, 0, 0.15)" : "transparent",
            "&:hover": {
              background: isActive
                ? "rgba(255, 0, 0, 0.22)"
                : "rgba(255, 255, 255, 0.08)",
            },
            transition: "all 0.2s ease",
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: isExpanded ? 2.5 : 0,
              justifyContent: "center",
              color: isActive ? "#FF0000" : "rgba(255,255,255,0.7)",
            }}
          >
            {item.icon}
          </ListItemIcon>

          {isExpanded ? (
            <ListItemText
              primary={item.label}
              sx={{
                m: 0,
                "& .MuiTypography-root": {
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14,
                  color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                },
              }}
            />
          ) : (
            <Typography
              variant="caption"
              sx={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                textAlign: "center",
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
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? open : true}
      onClose={onClose}
      disableScrollLock={true}
      ModalProps={{
        keepMounted: true,
        disableScrollLock: true,
      }}
      sx={{
        width: currentWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: currentWidth,
          boxSizing: "border-box",
          overflowX: "hidden",
          overflowY: "hidden",
          border: "none",
          background: theme.palette.background.paper,
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.easeInOut,
            duration: 280,
          }),
        },
      }}
    >
      <Toolbar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          pt: 2,
          px: isExpanded ? 1.5 : 0,
          justifyContent: "space-between",
        }}
      >
        <List sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </List>

        <Box>
          <Divider
            sx={{
              borderColor: "rgba(255,255,255,0.1)",
              my: 1,
              mx: isExpanded ? 1 : 2,
            }}
          />
          <List
            sx={{ display: "flex", flexDirection: "column", gap: 0.5, pb: 2 }}
          >
            {bottomItems.map((item, index) => renderMenuItem(item, index))}
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
