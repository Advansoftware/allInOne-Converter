import { useState, useEffect } from "react";
import { Container, Box, Typography, Button } from "@mui/material";
import ConverterPageButton from "./ConverterPageButton";
import UploadQueue from "./UploadQueue";
import DialogUpload from "./DialogUpload";
import axios from "axios";

interface UploadItem {
  id: string;
  name: string;
  date: string;
  thumbnail: string;
  progress: number;
  status: "enviando" | "convertendo" | "pronto";
  downloadUrl?: string;
}

function Dashboard() {
  const [open, setOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  // Keep the original test logic
  const test = async () => {
    try {
        let data = await axios.get("http://localhost:8080/api/teste/");
        console.log(data);
    } catch(e) {
        console.error("API test failed", e);
    }
  };
  
  useEffect(() => {
    test();
  }, []);

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
    alert("Download: " + id);
  };

  return (
    <Box>
       <Box sx={{ 
         display: 'flex', 
         justifyContent: 'space-between', 
         alignItems: 'center', 
         mb: { xs: 2, sm: 4 },
         flexWrap: 'wrap',
         gap: 2,
       }}>
            <Typography 
              variant="h4" 
              color="text.primary"
              sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }}
            >
                Painel do Canal
            </Typography>
       </Box>
       
       <ConverterPageButton setOpen={setOpen} />

      <DialogUpload open={open} setOpen={setOpen} addUpload={addUpload} />
      
      {/* 
        We can repurpose UploadQueue to look more like the "Content" list in YT Studio,
        but for now we keep it as the main view
      */}
      <UploadQueue uploads={uploads} onDownload={handleDownload} />
    </Box>
  );
}

export default Dashboard;
