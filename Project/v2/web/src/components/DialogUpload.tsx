import Button from '@mui/material/Button';
import * as Mui from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import ModalImage from '../assets/modalImage.svg';
import { Box, Grid, TextField } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import styled from 'styled-components';
import { useRef, useState } from 'react';

const BootstrapDialog = Mui.styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialog-container': {
    backdropFilter: 'blur(3px)',
  },
  
}));
const InputDialog = Mui.styled(TextField)(({ theme }) => ({
  '& .MuiFilledInput-root': {
    borderRadius: '0px'
  },
  '& .MuiFilledInput-root:before': {
    borderBottom: "1px solid #FD2C2C"
  }
  
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
  const [url, setUrl] = useState('');
  const handleSubmitEnter = (e) =>{
    if(e.key==='Enter'&&url!==''){
      console.log(url)
    }
  }
  const handleSubmit = (e)=>{
    console.log(url);
  }
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <BootstrapDialog
        fullWidth
        scroll='body'
        maxWidth='md'
        open={open}
      >
        <BootstrapDialogTitle id="customized-dialog-title" onClose={handleClose}>
          Enviar Video
        </BootstrapDialogTitle>
        <DialogContent dividers>
          <Grid container justifyContent='center' spacing={2} alignSelf='center'>
            <Grid item xs={12} sx={{textAlign: 'center'}}>
              <Logo src={ModalImage} alt="Modal Image"/>
            </Grid>
            <Grid item>
            <Typography variant='h5' sx={{textAlign: 'center'}} m={1}>
              Arraste e solte os arquivos de vídeo para fazer o envio
            </Typography>
            </Grid>
            <Grid item xs={12} textAlign='center'>
            <Button autoFocus onClick={handleClose} variant="contained" color="error">
              Selecionar Arquivos
            </Button>
            </Grid>
            <Grid item xs={12} textAlign='center'>
            <Typography variant='h6' sx={{textAlign: 'center'}} >
              Ou
            </Typography>
            </Grid>
            <Grid item xs={12} md={6} textAlign='center'>
            <Box sx={{ display: 'flex', alignItems: 'flex-end' }}> 
            <InputDialog 
               fullWidth label="Digite a url" variant="filled"
               color='error'
               sx={{borderBottom: "1px solid #FD2C2C"}}
               onChange={(e)=>setUrl(e.target.value)}
               onKeyDown={handleSubmitEnter}
            />
            <CloudDownloadIcon 
              onClick={handleSubmit}
              sx={{
                padding: '1.05rem 1rem',
                backgroundColor: '#FD2C2C', 
                cursor: 'pointer'
              }}
            />
          </Box>
            </Grid>
          </Grid>
        </DialogContent>
      </BootstrapDialog>
    </div>
  );
}