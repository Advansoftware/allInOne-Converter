import { Container } from "@mui/system";
import axios from "axios";
import { useEffect, useState } from "react";
import ConverterPageButton from "./components/ConverterPageButton";
import UploadQueue from "./components/UploadQueue";
import Navbar from "./components/Navbar";
import DialogUpload from "./components/DialogUpload";

interface UploadItem {
  id: string;
  name: string;
  date: string;
  thumbnail: string;
  progress: number;
  status: "enviando" | "convertendo" | "pronto";
  downloadUrl?: string;
}

function App() {
  const [open, setOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const test = async () => {
    let data = await axios.get("http://localhost:8080/api/teste/");
    console.log(data);
  };
  useEffect(() => {
    test();
  }, []);

  // Adiciona um upload à fila (pode ser chamado pelo DialogUpload após upload real)
  const addUpload = (file: { name: string; thumbnail: string }) => {
    const newUpload: UploadItem = {
      id: Date.now().toString(),
      name: file.name,
      date: new Date().toLocaleDateString(),
      thumbnail: file.thumbnail,
      progress: 0,
      status: "enviando",
    };
    setUploads((prev) => [...prev, newUpload]);
  };

  // Exemplo de função para simular progresso e finalização
  // (depois integre com upload real)
  useEffect(() => {
    if (uploads.length > 0) {
      const interval = setInterval(() => {
        setUploads((prev) =>
          prev.map((u) => {
            if (u.status === "enviando" && u.progress < 100) {
              return { ...u, progress: u.progress + 10 };
            } else if (u.status === "enviando" && u.progress >= 100) {
              return { ...u, status: "convertendo", progress: 100 };
            } else if (u.status === "convertendo") {
              return {
                ...u,
                status: "pronto",
                progress: 100,
                downloadUrl: "#",
              };
            }
            return u;
          })
        );
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [uploads]);

  const handleDownload = (id: string) => {
    // lógica para download
    alert("Download: " + id);
  };

  return (
    <>
      <Navbar setOpenModal={() => setOpen(true)} />
      <Container sx={{ marginTop: 10 }}>
        <ConverterPageButton setOpen={() => setOpen(true)} />
        <DialogUpload open={open} setOpen={setOpen} addUpload={addUpload} />
        <UploadQueue uploads={uploads} onDownload={handleDownload} />
      </Container>
    </>
  );
}

export default App;
