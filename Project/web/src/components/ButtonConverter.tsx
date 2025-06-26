import VideoCallIcon from "@mui/icons-material/VideoCall";
import Button from "@mui/material/Button";
interface ButtonConverterProps {
  children: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}
const ButtonConverter = ({ children, onClick }: ButtonConverterProps) => {
  return (
    <Button
      onClick={onClick}
      color="primary"
      variant="contained"
      sx={{
        background: "#FF0000",
        border: "none",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        flexGrow: 1,
        padding: ".7rem 1.2rem",
        color: "white",
        fontStyle: "normal",
        fontWeight: "700",
        textTransform: "uppercase",
        fontSize: 16,
        letterSpacing: 1,
        boxShadow: "0 2px 8px 0 rgba(255,0,0,0.10)",
        cursor: "pointer",
        borderRadius: 2,
        transition: "background 0.2s, box-shadow 0.2s",
        "&:hover": {
          background: "#d90000",
          boxShadow: "0 4px 16px 0 rgba(255,0,0,0.18)",
        },
      }}
    >
      <VideoCallIcon sx={{ color: "#fff", marginRight: ".5rem" }} />
      {children}
    </Button>
  );
};
export default ButtonConverter;
