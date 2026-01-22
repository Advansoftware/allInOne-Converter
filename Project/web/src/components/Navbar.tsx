import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import LogoImage from "../assets/logo_white.png";
import ButtonConverter from "./ButtonConverter";

const settings = ["Minha Conta", "Sair"];

interface NavbarProps {
  setOpenModal: () => void;
}

function Navbar({ setOpenModal }: NavbarProps) {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null
  );
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );
  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar
      position="fixed"
      color="transparent"
      sx={{
        background: "#181A20",
        border: "none",
        boxShadow: "0 2px 16px 0 rgba(255,0,0,0.08)",
        minHeight: 72,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Toolbar disableGutters sx={{ width: "99%" }}>
        <Box
          component="img"
          src={LogoImage}
          alt="logo"
          sx={{
            display: "inline-block",
            width: { xs: "8rem", sm: "11rem" },
            ml: { xs: 1, sm: 2 },
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Box mr={2}>
          <ButtonConverter onClick={setOpenModal}>Converter</ButtonConverter>
        </Box>
        <Box sx={{ flexGrow: 0 }}>
          <Tooltip title="Open settings">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar
                alt="Remy Sharp"
                src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
              />
            </IconButton>
          </Tooltip>
          <Menu
            sx={{ mt: "45px" }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            keepMounted
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            {settings.map((setting) => (
              <MenuItem key={setting} onClick={handleCloseUserMenu}>
                <Typography
                  textAlign="center"
                  sx={{ color: "#FF0000", fontWeight: 600 }}
                >
                  {setting}
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
export default Navbar;
