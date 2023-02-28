
import { Container } from "@mui/system"
import axios from "axios";
import { useEffect, useState } from "react";
import ConverterPageButton from "./components/ConverterPageButton";
import DialogUpload from "./components/DialogUpload"
import Navbar from "./components/Navbar"

function App() {
  const [open, setOpen] = useState(false);

  const test = async() =>{
    let data = await axios.get('http://localhost:8080/api/teste/');
    console.log(data);
  } 
  useEffect(()=>{
    test();
  },[])
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
