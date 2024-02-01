import VideoCallIcon from '@mui/icons-material/VideoCall';
import Button from '@mui/material/Button';
interface ButtonConverterProps {
  children: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}
const ButtonConverter =  ({children, onClick}: ButtonConverterProps) =>{
  return(
    <Button onClick={onClick} sx={{
      backgroundColor: 'transparent',
      border: "1px solid rgba(162, 159, 159, 0.76)",
      display: "flex",
      justifyContent: 'space-around',
      alignItems: 'center',
      flexGrow: 1,
      padding: '.5rem .8rem',
      color: 'white',
      fontStyle: 'normal',
      fontWeight: '700',
      textTransform: 'uppercase',
      cursor: 'pointer'
    }}>
    <VideoCallIcon sx={{color:'#FD2C2C', marginRight: '.3rem'}}></VideoCallIcon>
      {children}
    </Button>
  )
}
export default ButtonConverter;