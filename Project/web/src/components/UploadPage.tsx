import * as Mui from "@mui/material/styles";
import Dropzone from "./Dropzone";
import { Grid, Typography, Box, TextField } from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

const InputDialog = Mui.styled(TextField)(({ theme }) => ({
  "& .MuiFilledInput-root": {
    borderRadius: 8,
    background: "#23242b",
    color: "#fff",
    fontWeight: 500,
    fontSize: 16,
    boxShadow: "0 2px 8px 0 rgba(255,0,0,0.08)",
  },
  "& .MuiFilledInput-root:before": {
    borderBottom: "2px solid #FF0000",
  },
  "& .MuiInputLabel-root": {
    color: "#FF0000",
    fontWeight: 600,
  },
}));

const UploadPage = ({
  setStarter,
  setVideo,
  video,
  starter,
  setUrl,
  url,
}: any) => {
  const handleSubmitEnter = (e) => {
    if (e.key === "Enter" && url !== "") {
      console.log(url);
    }
  };
  const handleSubmit = (e) => {
    console.log(url);
  };
  const handleDrop = (newFiles) => {
    setVideo(newFiles);
  };
  return (
    <>
      <Grid container justifyContent="center" spacing={2} alignSelf="center">
        <Dropzone
          disabled={!!video.length ? true : false}
          files={video || null}
          onDrop={handleDrop}
          setStarter={setStarter}
        />
        <Grid item xs={12} textAlign="center">
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
              color: "#FF0000",
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
              background: "#23242b",
              borderRadius: 4,
              boxShadow: "0 2px 8px 0 rgba(255,0,0,0.08)",
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
              sx={{ borderBottom: "2px solid #FF0000" }}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleSubmitEnter}
            />
            <CloudDownloadIcon
              onClick={handleSubmit}
              sx={{
                padding: "1.05rem 1rem",
                backgroundColor: "#FF0000",
                color: "#fff",
                borderRadius: 2,
                cursor: "pointer",
                fontSize: 36,
                boxShadow: "0 2px 8px 0 rgba(255,0,0,0.10)",
                transition:
                  "background 0.18s, box-shadow 0.18s, transform 0.18s",
                "&:hover": {
                  background: "#d90000",
                  boxShadow: "0 4px 16px 0 rgba(255,0,0,0.18)",
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
