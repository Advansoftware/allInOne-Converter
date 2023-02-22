import { Box } from "@mui/material";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import 'react-circular-progressbar/dist/styles.css';


const ProgressStatus = ({porcentage}) =>{
  return(
    <Box sx={{width: 90, display:'flex', justifyContent: 'center'}}>
    <CircularProgressbar
    value={porcentage}
    text={`${porcentage}%`}
    background
    backgroundPadding={6}
    styles={buildStyles({
      backgroundColor:'rgba(0, 0, 0, .7)',
      textColor: "#fff",
      pathColor: "#FD2C2C",
      trailColor: "transparent",
      textSize: 19,
    })}
  />
</Box>
  )
}
export default ProgressStatus;