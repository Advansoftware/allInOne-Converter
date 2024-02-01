import * as Mui from '@mui/material/styles';
import Dropzone from "./Dropzone";
import {Grid, Typography, Box, TextField} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

const InputDialog = Mui.styled(TextField)(({ theme }) => ({
  '& .MuiFilledInput-root': {
    borderRadius: '0px'
  },
  '& .MuiFilledInput-root:before': {
    borderBottom: "1px solid #FD2C2C"
  }
  
}));

const UploadPage = ({setStarter, setVideo, video, starter, setUrl, url}) =>{
  const handleSubmitEnter = (e) =>{
    if(e.key==='Enter'&&url!==''){
      console.log(url)
    }
  }
  const handleSubmit = (e)=>{
    console.log(url);
  }
  const handleDrop = (newFiles) => {
    setVideo(newFiles);
};
return(<>
 <Grid container justifyContent='center' spacing={2} alignSelf='center'>
    <Dropzone
      disabled={!!video.length ? true : false}
      files={video||null}
      onDrop={handleDrop}
      setStarter={setStarter}
    />
    <Grid item xs={12} textAlign='center'>
      <Typography variant='h6' sx={{textAlign: 'center'}} >
        Ou
      </Typography>
    </Grid>
    <Grid item xs={12} md={6} textAlign='center'>
      <Box sx={{ display: 'flex', alignItems: 'flex-end' }}> 
        <InputDialog 
          disabled={starter}
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
</>);
}
export default UploadPage;