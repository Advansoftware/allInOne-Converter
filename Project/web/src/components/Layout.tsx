import { useState, useEffect, useRef } from "react";
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
import websocketService from "../services/websocket";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(true);
  const [activeTorrents, setActiveTorrents] = useState(0);
  const torrentsMapRef = useRef<Map<string, string>>(new Map());

  // Load initial torrents count once and use WebSocket for updates
  useEffect(() => {
    // Initial fetch only once
    const fetchInitialTorrents = async () => {
      try {
        const response = await torrentService.list();
        const torrents = response.data.torrents || [];
        // Build initial map
        torrentsMapRef.current.clear();
        torrents.forEach((t: any) => {
          torrentsMapRef.current.set(t.job_id, t.status);
        });
        // Count active
        const downloading = torrents.filter(
          (t: any) => t.status === "downloading" || t.status === "metadata",
        ).length;
        setActiveTorrents(downloading);
      } catch {
        // Ignore errors
      }
    };

    fetchInitialTorrents();

    // Subscribe to WebSocket updates for real-time count
    const unsubscribe = websocketService.onJobUpdate((update) => {
      if (update.type !== "torrent") return;

      // Update our local map
      torrentsMapRef.current.set(update.job_id, update.status);

      // Recalculate active count
      let activeCount = 0;
      torrentsMapRef.current.forEach((status) => {
        if (status === "downloading" || status === "metadata") {
          activeCount++;
        }
      });
      setActiveTorrents(activeCount);
    });

    return () => {
      unsubscribe();
    };
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
