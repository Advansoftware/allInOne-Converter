import * as Mui from "@mui/material/styles";
import { Grid, Typography, Box, TextField } from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import Dropzone from "./Dropzone";

const InputDialog = Mui.styled(TextField)(({ theme }) => ({
  "& .MuiFilledInput-root": {
    borderRadius: 8,
    background: theme.palette.background.paper,
    color: "#fff",
    fontWeight: 500,
    fontSize: 16,
    boxShadow: "0 2px 8px 0 rgba(0,0,0,0.2)",
  },
  "& .MuiFilledInput-root:before": {
    borderBottom: `2px solid ${theme.palette.primary.main}`,
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
}));

interface UploadPageProps {
  setStarter: (value: boolean) => void;
  setVideo: (files: File[]) => void;
  video: File[];
  starter: boolean;
  setUrl: (url: string) => void;
  url: string;
}

const UploadPage = ({
  setStarter,
  setVideo,
  video,
  starter,
  setUrl,
  url,
}: UploadPageProps) => {
  const theme = Mui.useTheme();
  
  const handleSubmitEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && url !== "") {
      console.log(url);
    }
  };
  
  const handleSubmit = () => {
    console.log(url);
  };
  
  const handleDrop = (newFiles: File[]) => {
    setVideo(newFiles);
  };
  
  return (
    <>
      <Grid container justifyContent="center" spacing={2} alignSelf="center">
        <Dropzone
          disabled={video.length > 0}
          files={video}
          onDrop={handleDrop}
          setStarter={setStarter}
        />
        <Grid item xs={12} textAlign="center">
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
              color: theme.palette.primary.main,
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            Ou
          </Typography>
        </Grid>
        <Grid item xs={12} md={6} textAlign="center">
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              background: theme.palette.background.paper,
              borderRadius: 4,
              boxShadow: "0 2px 8px 0 rgba(0,0,0,0.2)",
              p: 1,
              gap: 1,
            }}
          >
            <InputDialog
              disabled={starter}
              fullWidth
              label="Digite a url"
              variant="filled"
              color="error"
              sx={{ borderBottom: `2px solid ${theme.palette.primary.main}` }}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleSubmitEnter}
            />
            <CloudDownloadIcon
              onClick={handleSubmit}
              sx={{
                padding: "1.05rem 1rem",
                backgroundColor: theme.palette.primary.main,
                color: "#fff",
                borderRadius: 2,
                cursor: "pointer",
                fontSize: 36,
                boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
                transition:
                  "background 0.18s, box-shadow 0.18s, transform 0.18s",
                "&:hover": {
                  background: "#d90000",
                  boxShadow: "0 4px 16px 0 rgba(0,0,0,0.18)",
                  transform: "scale(1.08)",
                },
              }}
            />
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default UploadPage;
