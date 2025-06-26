import * as Mui from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import { Divider, Grid } from "@mui/material";

import CloudSyncOutlinedIcon from "@mui/icons-material/CloudSyncOutlined";
import { useEffect, useState } from "react";
import UploadPage from "./UploadPage";

const BootstrapDialog = Mui.styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialog-container": {
    backdropFilter: "blur(3px)",
  },
}));

export interface DialogTitleProps {
  id: string;
  children?: React.ReactNode;
  onClose: () => void;
}

function BootstrapDialogTitle(props: DialogTitleProps) {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
}

interface DialogUploadProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  addUpload: (file: { name: string; thumbnail: string }) => void;
}

export default function DialogUpload({
  open,
  setOpen,
  addUpload,
}: DialogUploadProps) {
  const [url, setUrl] = useState("");
  const [openFile, setOpenFile] = useState(false);
  const [video, setVideo] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [starter, setStarter] = useState(false);
  const [page, setPage] = useState(0);

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (starter) {
      setPage(1);
    }
    console.log("page: ", page);
  }, [starter]);

  // Quando o vídeo for selecionado, adiciona à fila e fecha o modal
  useEffect(() => {
    if (starter && video.length > 0) {
      const file = video[0];
      const thumbnail =
        file.type.startsWith("image/") || file.type.startsWith("video/")
          ? URL.createObjectURL(file)
          : "/src/assets/modalImage.svg";
      addUpload({ name: file.name, thumbnail });
      setOpen(false);
      setStarter(false);
      setVideo([]);
      setPage(0);
    }
  }, [starter]);

  return (
    <div>
      <BootstrapDialog fullWidth scroll="body" maxWidth="md" open={open}>
        <BootstrapDialogTitle
          id="customized-dialog-title"
          onClose={handleClose}
        >
          Enviar Video
        </BootstrapDialogTitle>
        <DialogContent dividers>
          {page === 0 && (
            <UploadPage
              setStarter={setStarter}
              setVideo={setVideo}
              video={video}
              starter={starter}
              setUrl={setUrl}
              url={url}
            />
          )}
          {starter && (
            <>
              <Divider sx={{ marginY: 2 }} />
              <Grid container spacing={2}>
                <Grid item>
                  <CloudSyncOutlinedIcon htmlColor="#7184fb" />
                </Grid>
                <Grid item>
                  <Typography variant="caption" color="textSecondary">
                    Enviando: {uploadProgress}%
                  </Typography>
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
      </BootstrapDialog>
    </div>
  );
}
