import { useState, useEffect } from "react";
import {
  Box,
  Toolbar,
  CssBaseline,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import { torrentService } from "../services/api";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(true);
  const [activeTorrents, setActiveTorrents] = useState(0);

  // Fetch active torrents count for badge
  useEffect(() => {
    const fetchTorrents = async () => {
      try {
        const response = await torrentService.list();
        const downloading =
          response.data.torrents?.filter(
            (t: any) => t.status === "downloading" || t.status === "metadata",
          ).length || 0;
        setActiveTorrents(downloading);
      } catch {
        // Ignore errors
      }
    };

    fetchTorrents();
    const interval = setInterval(fetchTorrents, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const drawerWidth = open ? 240 : 72;

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <TopBar onMenuClick={toggleDrawer} />
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        activeTorrents={activeTorrents}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          backgroundColor: "#1F1F1F",
          minHeight: "100vh",
          marginLeft: isMobile ? 0 : 0,
          transition: theme.transitions.create(["margin", "width"], {
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
