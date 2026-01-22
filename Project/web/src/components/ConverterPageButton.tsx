import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { CardActionArea, Box, useMediaQuery, useTheme } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

interface ConverterPageButtonProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ConverterPageButton = ({ setOpen }: ConverterPageButtonProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        minHeight: { xs: "50vh", md: "60vh" },
        alignItems: "center",
        px: { xs: 2, sm: 3 },
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          width: "100%",
          borderRadius: 4,
          background: "linear-gradient(145deg, rgba(40,40,40,0.98) 0%, rgba(24,24,24,1) 100%)",
          border: "1px solid rgba(255,0,0,0.2)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, #FF0000 0%, #ff4444 50%, #FF0000 100%)",
          },
          "&:hover": {
            boxShadow: "0 16px 60px rgba(255,0,0,0.2), 0 8px 32px rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,0,0,0.4)",
            transform: "translateY(-4px)",
          },
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <CardActionArea 
          onClick={() => setOpen(true)} 
          sx={{ 
            p: { xs: 3, sm: 4 },
            "&:hover .play-icon": {
              transform: "scale(1.1)",
              boxShadow: "0 8px 32px rgba(255,0,0,0.5)",
            },
          }}
        >
          <CardContent sx={{ textAlign: "center", p: 0 }}>
            {/* Icon Container */}
            <Box
              className="play-icon"
              sx={{
                width: { xs: 80, sm: 100 },
                height: { xs: 80, sm: 100 },
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FF0000 0%, #cc0000 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
                boxShadow: "0 6px 24px rgba(255,0,0,0.4)",
                transition: "all 0.3s ease",
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: -8,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,0,0,0.2)",
                  animation: "pulse-ring 2s infinite",
                },
                "@keyframes pulse-ring": {
                  "0%": { transform: "scale(1)", opacity: 1 },
                  "100%": { transform: "scale(1.3)", opacity: 0 },
                },
              }}
            >
              <PlayArrowIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: "#fff" }} />
            </Box>

            {/* Title */}
            <Typography
              variant="h4"
              sx={{
                color: "#fff",
                fontWeight: 700,
                letterSpacing: 0.5,
                mb: 1,
                fontSize: { xs: 24, sm: 28 },
              }}
            >
              Converter Agora
            </Typography>

            {/* Subtitle */}
            <Typography
              variant="body1"
              sx={{ 
                color: "rgba(255,255,255,0.6)", 
                fontWeight: 400,
                mb: 2,
                fontSize: { xs: 14, sm: 16 },
              }}
            >
              Converta vídeos, áudios e imagens em segundos
            </Typography>

            {/* Features */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: { xs: 2, sm: 3 },
                flexWrap: "wrap",
              }}
            >
              {["YouTube", "MP4", "MP3", "GIF"].map((format) => (
                <Box
                  key={format}
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    background: "rgba(255,0,0,0.1)",
                    border: "1px solid rgba(255,0,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <AutoAwesomeIcon sx={{ fontSize: 14, color: "#FF0000" }} />
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {format}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </Box>
  );
};

export default ConverterPageButton;
