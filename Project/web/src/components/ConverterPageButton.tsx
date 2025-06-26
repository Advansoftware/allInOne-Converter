import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { CardActionArea, Container, Grid } from "@mui/material";
import styled from "styled-components";
import Image from "../assets/btnImage.svg";

interface ConverterPageButtonProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const BtnImage = styled.img`
  width: 10rem;
  filter: drop-shadow(0 2px 12px #ff000055);
`;

const ConverterPageButton = ({ setOpen }: ConverterPageButtonProps) => {
  return (
    <Container
      sx={{
        display: "flex",
        justifyContent: "center",
        minHeight: "70vh",
        alignItems: "center",
      }}
    >
      <Card
        sx={{
          maxWidth: 700,
          borderRadius: 4,
          background: "rgba(24,26,32,0.98)",
          border: "2px solid #FF0000",
          boxShadow: "0 6px 32px 0 rgba(255,0,0,0.10)",
          transition: "box-shadow 0.2s, border 0.2s, transform 0.18s",
          "&:hover": {
            boxShadow: "0 12px 48px 0 rgba(255,0,0,0.18)",
            border: "2.5px solid #FF0000",
            transform: "scale(1.01)",
          },
        }}
      >
        <CardActionArea onClick={() => setOpen(true)} sx={{ p: 2 }}>
          <CardContent>
            <Grid
              container
              justifyContent="center"
              alignItems="center"
              spacing={4}
            >
              <Grid item xs={12} md={3} textAlign="center">
                <BtnImage src={Image} alt="Button Image" />
              </Grid>
              <Grid item xs={12} md={9} textAlign="center">
                <Typography
                  gutterBottom
                  variant="h4"
                  component="div"
                  sx={{
                    color: "#FF0000",
                    fontWeight: 800,
                    letterSpacing: 1.2,
                    mb: 1,
                  }}
                >
                  Converter Agora
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 400 }}
                >
                  Clique aqui para iniciar a conversão de arquivos!
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </CardActionArea>
      </Card>
    </Container>
  );
};
export default ConverterPageButton;
