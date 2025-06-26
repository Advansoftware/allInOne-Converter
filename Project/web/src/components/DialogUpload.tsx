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
import ConversionModal from "./ConversionModal";
import AdvancedConversionModal from "./AdvancedConversionModal";
import conversionProfiles from "../conversionProfiles.json";

const BootstrapDialog = Mui.styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
    background: "#181A20",
    borderRadius: 16,
  },
  "& .MuiDialog-container": {
    backdropFilter: "blur(5px)",
    background: "rgba(24,26,32,0.7)",
  },
  "& .MuiPaper-root": {
    borderRadius: 16,
    boxShadow: "0 8px 48px 0 rgba(255,0,0,0.18)",
    border: "2px solid #FF0000",
    background: "#23242b",
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
    <DialogTitle
      sx={{
        m: 0,
        p: 2,
        color: "#FF0000",
        fontWeight: 700,
        fontSize: 24,
        letterSpacing: 1,
      }}
      {...other}
    >
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "#FF0000",
            background: "rgba(255,0,0,0.08)",
            borderRadius: 2,
            "&:hover": { background: "#FF0000", color: "#fff" },
            transition: "background 0.18s, color 0.18s",
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
  const [starter, setStarter] = useState(false);
  const [showConversion, setShowConversion] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  const handleClose = () => {
    setOpen(false);
    setShowConversion(false);
    setShowAdvanced(false);
    setVideo([]);
    setStarter(false);
    setSelectedProfile(null);
  };

  // Ao selecionar arquivo, abre o modal de conversão
  useEffect(() => {
    if (video.length > 0 && !showAdvanced) {
      setShowAdvanced(true);
    }
  }, [video]);

  // Ao confirmar conversão, adiciona à fila
  const handleAdvancedConvert = (options: any) => {
    if (video.length > 0) {
      const file = video[0];
      const thumbnail =
        file.type.startsWith("image/") || file.type.startsWith("video/")
          ? URL.createObjectURL(file)
          : "/src/assets/modalImage.svg";
      addUpload({ name: file.name, thumbnail });
      setOpen(false);
      setShowAdvanced(false);
      setVideo([]);
      setStarter(false);
    }
  };

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
          <UploadPage
            setStarter={setStarter}
            setVideo={setVideo}
            video={video}
            starter={starter}
            setUrl={setUrl}
            url={url}
          />
        </DialogContent>
      </BootstrapDialog>
      <AdvancedConversionModal
        open={showAdvanced}
        onClose={() => {
          setShowAdvanced(false);
          setVideo([]);
        }}
        onConvert={handleAdvancedConvert}
      />
    </div>
  );
}
