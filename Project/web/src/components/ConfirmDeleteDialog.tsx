import { forwardRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Slide,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { TransitionProps } from "@mui/material/transitions";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-container": {
    backdropFilter: "blur(8px)",
    background: "rgba(0,0,0,0.7)",
  },
  "& .MuiPaper-root": {
    borderRadius: 16,
    boxShadow: "0 24px 80px rgba(255,0,0,0.15), 0 8px 32px rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,0,0,0.3)",
    background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, #1a1a1a 100%)`,
    backgroundImage: "none",
    overflow: "hidden",
    minWidth: 400,
    maxWidth: 450,
  },
}));

const DeleteButton = styled(Button)(() => ({
  background: "linear-gradient(135deg, #FF0000 0%, #cc0000 100%)",
  color: "#fff",
  fontWeight: 600,
  padding: "10px 24px",
  borderRadius: 10,
  textTransform: "none",
  fontSize: 15,
  boxShadow: "0 4px 12px rgba(255,0,0,0.3)",
  "&:hover": {
    background: "linear-gradient(135deg, #ff3333 0%, #FF0000 100%)",
    boxShadow: "0 6px 20px rgba(255,0,0,0.4)",
  },
}));

const CancelButton = styled(Button)(() => ({
  background: "rgba(255,255,255,0.05)",
  color: "rgba(255,255,255,0.7)",
  fontWeight: 500,
  padding: "10px 24px",
  borderRadius: 10,
  textTransform: "none",
  fontSize: 15,
  border: "1px solid rgba(255,255,255,0.1)",
  "&:hover": {
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
  },
}));

interface ConfirmDeleteDialogProps {
  open: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDeleteDialog({
  open,
  itemName,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDeleteDialogProps) {
  return (
    <StyledDialog
      open={open}
      TransitionComponent={Transition}
      onClose={onCancel}
      aria-labelledby="confirm-delete-dialog"
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          background:
            "linear-gradient(90deg, rgba(255,0,0,0.15) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: "linear-gradient(135deg, #FF0000 0%, #cc0000 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(255,0,0,0.3)",
          }}
        >
          <DeleteForeverIcon sx={{ color: "#fff", fontSize: 22 }} />
        </Box>
        <Typography
          sx={{
            color: "#fff",
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: 0.5,
          }}
        >
          Confirmar Exclusão
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onCancel}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            color: "rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.05)",
            borderRadius: 2,
            width: 36,
            height: 36,
            "&:hover": {
              background: "rgba(255,0,0,0.2)",
              color: "#FF0000",
            },
            transition: "all 0.2s ease",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: "rgba(255,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid rgba(255,0,0,0.3)",
            }}
          >
            <WarningAmberIcon sx={{ fontSize: 36, color: "#FF0000" }} />
          </Box>

          <Typography
            sx={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 16,
              lineHeight: 1.6,
            }}
          >
            Tem certeza que deseja excluir
          </Typography>

          <Typography
            sx={{
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              background: "rgba(255,0,0,0.1)",
              padding: "8px 16px",
              borderRadius: 2,
              border: "1px solid rgba(255,0,0,0.2)",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {itemName}
          </Typography>

          <Typography
            sx={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 13,
              mt: 1,
            }}
          >
            Esta ação irá remover o item da fila e apagar todos os arquivos
            associados. Esta ação não pode ser desfeita.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2.5,
          pt: 1,
          gap: 1.5,
          justifyContent: "center",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <CancelButton onClick={onCancel} disabled={loading}>
          Cancelar
        </CancelButton>
        <DeleteButton
          onClick={onConfirm}
          disabled={loading}
          startIcon={
            loading ? null : <DeleteForeverIcon sx={{ fontSize: 18 }} />
          }
        >
          {loading ? "Excluindo..." : "Excluir"}
        </DeleteButton>
      </DialogActions>
    </StyledDialog>
  );
}
