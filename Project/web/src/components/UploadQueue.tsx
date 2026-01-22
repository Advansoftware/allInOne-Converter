import { Box, Typography, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, useTheme } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CloudSyncOutlinedIcon from "@mui/icons-material/CloudSyncOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import React from "react";
import ProgressStatus from "./ProgressStatus"; // Check if this needs update for small size

interface UploadItem {
  id: string;
  name: string;
  date: string;
  thumbnail: string;
  progress: number;
  status: "enviando" | "convertendo" | "pronto";
  downloadUrl?: string;
}

interface UploadQueueProps {
  uploads: UploadItem[];
  onDownload: (id: string) => void;
}

const statusText = {
  enviando: "Enviando",
  convertendo: "Convertendo",
  pronto: "Concluído",
};

export default function UploadQueue({ uploads, onDownload }: UploadQueueProps) {
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, px: 1 }}>
        Conteúdo do canal
      </Typography>
      
      {/* Filtering tabs would go here (Videos, Ao vivo, Posts, etc) */}
      
      <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', backgroundImage: 'none', boxShadow: 'none' }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox color="primary" />
              </TableCell>
              <TableCell sx={{ color: '#aaa', fontSize: 13 }}>Vídeo</TableCell>
              <TableCell sx={{ color: '#aaa', fontSize: 13 }}>Visibilidade</TableCell>
              <TableCell sx={{ color: '#aaa', fontSize: 13 }}>Data</TableCell>
              <TableCell sx={{ color: '#aaa', fontSize: 13 }}>Status</TableCell>
              <TableCell align="right" sx={{ color: '#aaa', fontSize: 13 }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {uploads.map((row) => (
              <TableRow
                key={row.id}
                sx={{ 
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
                    borderBottom: '1px solid #3F3F3F'
                }}
              >
                <TableCell padding="checkbox">
                   <Checkbox color="primary" />
                </TableCell>
                
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                     <Box 
                        component="img" 
                        src={row.thumbnail} 
                        alt={row.name}
                        sx={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 1 }}
                     />
                     <Box sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#fff' }} noWrap title={row.name}>
                            {row.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>
                            {/* Description or other meta can go here */}
                        </Typography>
                     </Box>
                  </Box>
                </TableCell>
                
                <TableCell sx={{ color: '#fff' }}>Privado</TableCell> {/* Placeholder */}
                
                <TableCell sx={{ color: '#fff' }}>
                    <Typography variant="body2">{row.date}</Typography>
                    <Typography variant="caption" sx={{ color: '#aaa' }}>Enviado</Typography>
                </TableCell>
                
                <TableCell>
                     {row.status === "enviando" && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CloudSyncOutlinedIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                            <Typography variant="body2">{row.progress}%</Typography>
                        </Box>
                     )}
                     {/* For real implementation, maybe a mini linear progress bar? */}
                     {row.status === "convertendo" && (
                         <Typography sx={{ color: '#fbc02d' }}>Processando {row.progress}%</Typography>
                     )}
                     {row.status === "pronto" && (
                         <Typography sx={{ color: '#fff' }}>Concluído</Typography>
                     )}
                </TableCell>
                
                <TableCell align="right">
                  <IconButton size="small" sx={{ color: '#aaa', opacity: 0, '.MuiTableRow-root:hover &': { opacity: 1 } }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ color: '#aaa', opacity: 0, '.MuiTableRow-root:hover &': { opacity: 1 } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                  {row.status === "pronto" && (
                      <IconButton size="small" onClick={() => onDownload(row.id)} sx={{ color: theme.palette.primary.main + '!important', opacity: 1 }}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                  )}
                </TableCell>

              </TableRow>
            ))}
            {uploads.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <Typography color="text.secondary">Nenhum vídeo encontrado</Typography>
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
