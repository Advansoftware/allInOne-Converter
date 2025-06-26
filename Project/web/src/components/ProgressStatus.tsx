import { Box } from "@mui/material";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
interface ProgressStatusProps {
  porcentage: number;
}

const ProgressStatus = ({ porcentage }: ProgressStatusProps) => {
  return (
    <Box
      sx={{
        width: 90,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        filter: "drop-shadow(0 2px 12px #ff000055)",
      }}
    >
      <CircularProgressbar
        value={porcentage}
        text={`${porcentage}%`}
        background
        backgroundPadding={6}
        styles={buildStyles({
          backgroundColor: "rgba(0, 0, 0, .7)",
          textColor: "#fff",
          pathColor: "#FF0000",
          trailColor: "#23242b",
          textSize: 19,
          pathTransition: "stroke-dashoffset 0.7s cubic-bezier(.4,2,.6,1)",
        })}
      />
    </Box>
  );
};
export default ProgressStatus;
