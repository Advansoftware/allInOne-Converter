import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { CardActionArea, Container, Grid } from '@mui/material';
import styled from 'styled-components';
import Image from '../assets/btnImage.svg';

const BtnImage = styled.img`
  width: 12rem;
`
const ConverterPageButton = ({setOpen})=>{
  return(
    <Container sx={{display: 'flex', justifyContent: 'center', height: '70vh', alignItems: 'center'}}>
      <Card sx={{ 
        maxWidth: 700, 
        borderRadius: '5px', 
        background: 'rgba(217, 217, 217, 0.1)',
        border: '1px dashed rgba(224, 224, 224, 0.38)',

    }}>
      <CardActionArea onClick={()=>setOpen(true)}>
        <CardContent>
          <Grid container justifyContent='space-between' alignContent='center' alignItems='center' spacing={4}>
            <Grid item xs={12} md={2} pr={5} textAlign="center">
              <BtnImage src={Image} alt="Button Image"/>
            </Grid>
            <Grid item xs={12} md={8} textAlign="center">
              <Typography gutterBottom variant="h6" component="div" color="rgba(255, 255, 255, 0.68)">
                Clique aqui  iniciar a conversão
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </CardActionArea>
    </Card>
    </Container>
  );
}
export default ConverterPageButton;