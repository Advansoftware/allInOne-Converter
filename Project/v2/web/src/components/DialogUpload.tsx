import * as React from 'react';
import Button from '@mui/material/Button';
import * as Mui from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import ModalImage from '../assets/modalImage.svg';
import { Grid } from '@mui/material';
import styled from 'styled-components';

const BootstrapDialog = Mui.styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
  
}));
const Logo = styled.img`
  width: 12rem;
`
export interface DialogTitleProps {
  id: string;
  children?: React.ReactNode;
  onClose: () => void;
}

function BootstrapDialogTitle(props: DialogTitleProps) {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2, }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
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

export default function DialogUpload({open, setOpen}) {

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <BootstrapDialog
        fullWidth
        maxWidth='md'
        open={open}
      >
        <BootstrapDialogTitle id="customized-dialog-title" onClose={handleClose}>
          Enviar Videos
        </BootstrapDialogTitle>
        <DialogContent dividers>
          <Grid container justifyContent='center' spacing={2} alignSelf='center'>
            <Grid item xs={12} sx={{textAlign: 'center'}}>
              <Logo src={ModalImage} alt="Modal Image"/>
            </Grid>
            <Grid item>
            <Typography variant='h5' sx={{textAlign: 'center'}} m={2}>
              Arraste e solte os arquivos de vídeo para fazer o envio
            </Typography>
            </Grid>
            <Grid item xs={12} textAlign='center'>
            <Button autoFocus onClick={handleClose} variant="contained" color="error">
              Selecionar Arquivos
            </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </BootstrapDialog>
    </div>
  );
}