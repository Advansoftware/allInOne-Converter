import {useEffect} from 'react';
import { Box, Button, Grid, List, ListItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { useDropzone } from "react-dropzone";
import styled from 'styled-components';
import ModalImage from '../assets/modalImage.svg';

const Logo = styled.img`
  width: 12rem;
`;
const Dropzone = ({
    accept,
    disabled,
    setStarter,
    submitFile,
    setOpenFile,
    files,
    getFilesFromEvent,
    maxFiles,
    maxSize,
    minSize,
    multiple,
    noClick,
    noDrag,
    noDragEventsBubbling,
    noKeyboard,
    onDrop,
    onDropAccepted,
    onDropRejected,
    onFileDialogCancel,
    onRemove,
    onRemoveAll,
    onUpload,
    preventDropOnDocument
}) => {

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept,
    maxFiles: 1,
    maxSize,
    disabled,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    minSize,
    onDrop,
  });
  useEffect(()=>{
    if(disabled){
      setStarter(true);
    }
  },[disabled]);

  return (

      <div {...getRootProps()}>

        <input {...getInputProps()} />

        <Grid item xs={12} sx={{textAlign: 'center'}}>
          <Logo src={ModalImage} alt="Modal Image"/>
        </Grid>
        <Grid item>
          <Typography variant='h5' sx={{textAlign: 'center'}} m={1}>
            Arraste e solte os arquivos de vídeo para fazer o envio
          </Typography>
        </Grid>
        <Grid item xs={12} textAlign='center'>
          <Button autoFocus onClick={open} variant="contained" color="error" disabled={disabled}>
            Selecionar Arquivos
          </Button>
        </Grid>
        {console.log(files[0])}
      {/*   {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <List>
            <ListItem
              key={useDropzone.path}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                "& + &": {
                  mt: 1,
                },
              }}
            > */}
              {/* <ListItemIcon>
                <DuplicateIcon fontSize="small" />
              </ListItemIcon> */}
            {/*   <ListItemText
                primary={files[0].name}
                primaryTypographyProps={{
                  color: "textPrimary",
                  variant: "subtitle2",
                }}
                secondary={files[0].size}
              />
              { submitFile && (
                <>Enviando</>
              )}
            </ListItem>
          </List>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 2,
            }}
          ></Box>
        </Box>
      )} */}
      </div>
  );
};


export default Dropzone;
