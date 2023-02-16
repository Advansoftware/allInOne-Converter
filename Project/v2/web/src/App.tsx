
import { Container } from "@mui/system"
import { useState } from "react";
import ConverterPageButton from "./components/ConverterPageButton";
import DialogUpload from "./components/DialogUpload"
import Navbar from "./components/Navbar"

function App() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Navbar setOpenModal={()=>setOpen(true)}/>
      <Container sx={{marginTop: 10}}>
        <ConverterPageButton setOpen={setOpen}/>
        <DialogUpload setOpen={setOpen} open={open}/>
      </Container>
     
    </>
  )
}

export default App
