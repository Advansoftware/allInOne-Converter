import { Box } from "@mui/material";
import { Container } from "@mui/system"
import { useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import ConverterPageButton from "./components/ConverterPageButton";
import DialogUpload from "./components/DialogUpload"
import Navbar from "./components/Navbar"
import ProgressStatus from "./components/ProgressStatus";

function App() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Navbar setOpenModal={()=>setOpen(true)}/>
      <Container sx={{marginTop: 10}}>
        <ConverterPageButton setOpen={setOpen}/>
        <DialogUpload setOpen={setOpen} open={open}/>
        {/* <ProgressStatus porcentage={40}/>*/}

      </Container>
     
    </>
  )
}

export default App
