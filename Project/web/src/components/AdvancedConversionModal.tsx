import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Slider,
  Tooltip,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import conversionProfiles from "../conversionProfiles.json";

interface Profile {
  id: string;
  name: string;
  description: string;
  ffmpeg: string;
}

interface AdvancedConversionModalProps {
  open: boolean;
  onClose: () => void;
  onConvert: (options: any) => void;
}

const videoFormats = ["mp4", "mov", "avi", "webm", "mkv", "gif"];
const audioFormats = ["mp3", "aac", "wav", "ogg", "flac"];
const codecs = ["libx264", "libx265", "mpeg4", "vp9", "copy"];
const audioCodecs = ["aac", "mp3", "opus", "copy"];
const sampleRates = [44100, 48000, 96000];
const channelOptions = [
  { label: "Mono", value: 1 },
  { label: "Estéreo", value: 2 },
];
const presets = [
  "ultrafast",
  "superfast",
  "veryfast",
  "faster",
  "fast",
  "medium",
  "slow",
  "slower",
  "veryslow",
];

const resolutions = [
  { label: "Original", value: "" },
  { label: "4K (3840x2160)", value: "3840:2160" },
  { label: "Full HD (1920x1080)", value: "1920:1080" },
  { label: "HD (1280x720)", value: "1280:720" },
  { label: "SD (854x480)", value: "854:480" },
  { label: "Instagram Story (1080x1920)", value: "1080:1920" },
];

const AdvancedConversionModal: React.FC<AdvancedConversionModalProps> = ({
  open,
  onClose,
  onConvert,
}) => {
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [format, setFormat] = useState<string>("mp4");
  const [codec, setCodec] = useState<string>("libx264");
  const [resolution, setResolution] = useState<string>("");
  const [bitrate, setBitrate] = useState<number>(2000);
  const [audioBitrate, setAudioBitrate] = useState<number>(192);
  const [fps, setFps] = useState<number>(30);
  const [customArgs, setCustomArgs] = useState<string>("");
  const [crf, setCrf] = useState<number>(23);
  const [preset, setPreset] = useState<string>("medium");
  const [aspectRatio, setAspectRatio] = useState<string>("");
  const [trimStart, setTrimStart] = useState<string>("");
  const [trimEnd, setTrimEnd] = useState<string>("");
  const [audioCodec, setAudioCodec] = useState<string>("aac");
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [channels, setChannels] = useState<number>(2);
  const [volume, setVolume] = useState<number>(100);
  const [removeAudio, setRemoveAudio] = useState<boolean>(false);
  const [outputName, setOutputName] = useState<string>("");
  const [overwrite, setOverwrite] = useState<boolean>(true);

  // Ao selecionar perfil, preenche campos
  const handleProfileSelect = (profile: Profile) => {
    setSelectedProfile(profile.id);
    // Reset para valores padrão antes de aplicar perfil
    setFormat("mp4");
    setCodec("libx264");
    setResolution("");
    setBitrate(2000);
    setAudioBitrate(192);
    setFps(30);
    setCrf(23);
    setPreset("medium");
    setAspectRatio("");
    setTrimStart("");
    setTrimEnd("");
    setAudioCodec("aac");
    setSampleRate(44100);
    setChannels(2);
    setVolume(100);
    setRemoveAudio(false);
    setOutputName("");
    setOverwrite(true);

    // Parse avançado do ffmpeg string do perfil
    const ffmpeg = profile.ffmpeg;
    if (ffmpeg.includes("scale=")) {
      const match = ffmpeg.match(/scale=(\d+:\d+)/);
      if (match) setResolution(match[1]);
    }
    if (ffmpeg.match(/-c:v (\S+)/)) {
      const match = ffmpeg.match(/-c:v (\S+)/);
      if (match) setCodec(match[1]);
    }
    if (ffmpeg.match(/-c:a (\S+)/)) {
      const match = ffmpeg.match(/-c:a (\S+)/);
      if (match) setAudioCodec(match[1]);
    }
    if (ffmpeg.match(/-b:v (\d+)k/)) {
      const match = ffmpeg.match(/-b:v (\d+)k/);
      if (match) setBitrate(Number(match[1]));
    }
    if (ffmpeg.match(/-b:a (\d+)k/)) {
      const match = ffmpeg.match(/-b:a (\d+)k/);
      if (match) setAudioBitrate(Number(match[1]));
    }
    if (ffmpeg.match(/-r (\d+)/)) {
      const match = ffmpeg.match(/-r (\d+)/);
      if (match) setFps(Number(match[1]));
    }
    if (ffmpeg.match(/-crf (\d+)/)) {
      const match = ffmpeg.match(/-crf (\d+)/);
      if (match) setCrf(Number(match[1]));
    }
    if (ffmpeg.match(/-preset (\S+)/)) {
      const match = ffmpeg.match(/-preset (\S+)/);
      if (match) setPreset(match[1]);
    }
    if (ffmpeg.match(/-aspect (\S+)/)) {
      const match = ffmpeg.match(/-aspect (\S+)/);
      if (match) setAspectRatio(match[1]);
    }
    if (ffmpeg.match(/-ss ([\d:.]+)/)) {
      const match = ffmpeg.match(/-ss ([\d:.]+)/);
      if (match) setTrimStart(match[1]);
    }
    if (ffmpeg.match(/-to ([\d:.]+)/)) {
      const match = ffmpeg.match(/-to ([\d:.]+)/);
      if (match) setTrimEnd(match[1]);
    }
    if (ffmpeg.match(/-ar (\d+)/)) {
      const match = ffmpeg.match(/-ar (\d+)/);
      if (match) setSampleRate(Number(match[1]));
    }
    if (ffmpeg.match(/-ac (\d+)/)) {
      const match = ffmpeg.match(/-ac (\d+)/);
      if (match) setChannels(Number(match[1]));
    }
    if (ffmpeg.match(/-filter:a "volume=([\d.]+)"/)) {
      const match = ffmpeg.match(/-filter:a "volume=([\d.]+)"/);
      if (match) setVolume(Number(match[1]) * 100);
    }
    if (ffmpeg.includes("-an")) setRemoveAudio(true);
    if (ffmpeg.match(/-f (\w+)/)) {
      const match = ffmpeg.match(/-f (\w+)/);
      if (match) setFormat(match[1]);
    }
    setCustomArgs(profile.ffmpeg);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: { background: "#23242b", borderRadius: 0, p: 0 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 3,
          borderBottom: "1px solid #333",
          background: "#181A20",
        }}
      >
        <Typography variant="h5" sx={{ color: "#FF0000", fontWeight: 800 }}>
          Conversor Avançado
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "#FF0000" }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: { xs: 2, md: 4 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography sx={{ color: "#fff", mb: 2, fontWeight: 700 }}>
              Perfis Rápidos
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {conversionProfiles.map((profile: Profile) => (
                <Paper
                  key={profile.id}
                  elevation={selectedProfile === profile.id ? 8 : 1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background:
                      selectedProfile === profile.id ? "#181A20" : "#23242b",
                    border:
                      selectedProfile === profile.id
                        ? "2px solid #FF0000"
                        : "1px solid #333",
                    cursor: "pointer",
                    transition: "all 0.18s",
                    "&:hover": {
                      border: "2px solid #FF0000",
                      background: "#181A20",
                    },
                  }}
                  onClick={() => handleProfileSelect(profile)}
                >
                  <Typography sx={{ color: "#FF0000", fontWeight: 700 }}>
                    {profile.name}
                  </Typography>
                  <Typography
                    sx={{ color: "#fff", opacity: 0.8, fontSize: 15 }}
                  >
                    {profile.description}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography sx={{ color: "#fff", mb: 2, fontWeight: 700 }}>
              Configuração Avançada
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#FF0000" }}>Formato</InputLabel>
                  <Select
                    value={format}
                    label="Formato"
                    onChange={(e) => setFormat(e.target.value)}
                    sx={{
                      color: "#fff",
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  >
                    {videoFormats.map((f) => (
                      <MenuItem key={f} value={f}>
                        {f.toUpperCase()}
                      </MenuItem>
                    ))}
                    {audioFormats.map((f) => (
                      <MenuItem key={f} value={f}>
                        {f.toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#FF0000" }}>Codec</InputLabel>
                  <Select
                    value={codec}
                    label="Codec"
                    onChange={(e) => setCodec(e.target.value)}
                    sx={{
                      color: "#fff",
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  >
                    {codecs.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#FF0000" }}>Resolução</InputLabel>
                  <Select
                    value={resolution}
                    label="Resolução"
                    onChange={(e) => setResolution(e.target.value)}
                    sx={{
                      color: "#fff",
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  >
                    {resolutions.map((r) => (
                      <MenuItem key={r.value} value={r.value}>
                        {r.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Tooltip title="Taxa de bits do vídeo (kbps)">
                  <TextField
                    label="Bitrate (kbps)"
                    type="number"
                    value={bitrate}
                    onChange={(e) => setBitrate(Number(e.target.value))}
                    fullWidth
                    inputProps={{ min: 100, max: 10000, step: 100 }}
                    placeholder="Ex: 2000"
                    sx={{
                      input: { color: "#fff" },
                      label: { color: "#FF0000" },
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  />
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Tooltip title="Taxa de bits do áudio (kbps)">
                  <TextField
                    label="Áudio Bitrate (kbps)"
                    type="number"
                    value={audioBitrate}
                    onChange={(e) => setAudioBitrate(Number(e.target.value))}
                    fullWidth
                    inputProps={{ min: 32, max: 320, step: 8 }}
                    placeholder="Ex: 192"
                    sx={{
                      input: { color: "#fff" },
                      label: { color: "#FF0000" },
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  />
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Tooltip title="Frames por segundo">
                  <Box>
                    <Slider
                      value={fps}
                      min={1}
                      max={60}
                      step={1}
                      onChange={(_, v) => setFps(Number(v))}
                      valueLabelDisplay="auto"
                      sx={{ color: "#FF0000" }}
                    />
                    <Typography sx={{ color: "#fff", fontSize: 13 }}>
                      FPS: {fps}
                    </Typography>
                  </Box>
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Tooltip title="Qualidade CRF (para x264/x265). 18=alta, 23=padrão, 28=baixa qualidade">
                  <TextField
                    label="CRF (Qualidade)"
                    type="number"
                    value={crf}
                    onChange={(e) => setCrf(Number(e.target.value))}
                    fullWidth
                    inputProps={{ min: 0, max: 51, step: 1 }}
                    placeholder="Ex: 23 (padrão)"
                    sx={{
                      input: { color: "#fff" },
                      label: { color: "#FF0000" },
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  />
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#FF0000" }}>
                    Preset (Velocidade)
                  </InputLabel>
                  <Select
                    value={preset}
                    label="Preset (Velocidade)"
                    onChange={(e) => setPreset(e.target.value)}
                    sx={{
                      color: "#fff",
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  >
                    {presets.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p} {p === "medium" && "(padrão)"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Tooltip title="Proporção (ex: 16:9, 4:3, 1:1)">
                  <TextField
                    label="Proporção (Aspect Ratio)"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    fullWidth
                    placeholder="Ex: 16:9"
                    sx={{
                      input: { color: "#fff" },
                      label: { color: "#FF0000" },
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  />
                </Tooltip>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Tooltip title="Corte inicial (segundos ou hh:mm:ss). Ex: 00:00:10">
                  <TextField
                    label="Corte Início"
                    value={trimStart}
                    onChange={(e) => setTrimStart(e.target.value)}
                    fullWidth
                    placeholder="Ex: 00:00:10"
                    sx={{
                      input: { color: "#fff" },
                      label: { color: "#FF0000" },
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  />
                </Tooltip>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Tooltip title="Corte final (segundos ou hh:mm:ss). Ex: 00:01:00">
                  <TextField
                    label="Corte Fim"
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(e.target.value)}
                    fullWidth
                    placeholder="Ex: 00:01:00"
                    sx={{
                      input: { color: "#fff" },
                      label: { color: "#FF0000" },
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  />
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#FF0000" }}>
                    Codec de Áudio
                  </InputLabel>
                  <Select
                    value={audioCodec}
                    label="Codec de Áudio"
                    onChange={(e) => setAudioCodec(e.target.value)}
                    sx={{
                      color: "#fff",
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  >
                    {audioCodecs.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c} {c === "aac" && "(padrão)"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#FF0000" }}>Sample Rate</InputLabel>
                  <Select
                    value={sampleRate}
                    label="Sample Rate"
                    onChange={(e) => setSampleRate(Number(e.target.value))}
                    sx={{
                      color: "#fff",
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  >
                    {sampleRates.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r} Hz {r === 44100 && "(padrão)"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#FF0000" }}>Canais</InputLabel>
                  <Select
                    value={channels}
                    label="Canais"
                    onChange={(e) => setChannels(Number(e.target.value))}
                    sx={{
                      color: "#fff",
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  >
                    {channelOptions.map((c) => (
                      <MenuItem key={c.value} value={c.value}>
                        {c.label} {c.value === 2 && "(padrão)"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Tooltip title="Volume do áudio (%) - 100 = normal, 200 = dobro, 50 = metade">
                  <TextField
                    label="Volume (%)"
                    type="number"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    fullWidth
                    inputProps={{ min: 0, max: 500, step: 1 }}
                    placeholder="Ex: 100 (normal)"
                    sx={{
                      input: { color: "#fff" },
                      label: { color: "#FF0000" },
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  />
                </Tooltip>
              </Grid>
              <Grid item xs={12}>
                <Tooltip title="Nome do arquivo de saída (opcional, ex: video_convertido.mp4)">
                  <TextField
                    label="Nome do Arquivo de Saída"
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    fullWidth
                    placeholder="Ex: video_convertido.mp4"
                    sx={{
                      input: { color: "#fff" },
                      label: { color: "#FF0000" },
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  />
                </Tooltip>
              </Grid>
              <Grid item xs={12}>
                <Tooltip title="Argumentos customizados do ffmpeg (avançado)">
                  <TextField
                    label="Custom Args"
                    value={customArgs}
                    onChange={(e) => setCustomArgs(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    sx={{
                      input: { color: "#fff" },
                      label: { color: "#FF0000" },
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "#FF0000",
                      },
                    }}
                  />
                </Tooltip>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
        <Button onClick={onClose} sx={{ color: "#fff" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          sx={{
            background: "#FF0000",
            color: "#fff",
            fontWeight: 700,
            borderRadius: 2,
            px: 3,
            "&:hover": { background: "#d90000" },
          }}
          onClick={() =>
            onConvert({
              format,
              codec,
              resolution,
              bitrate,
              audioBitrate,
              fps,
              crf,
              preset,
              aspectRatio,
              trimStart,
              trimEnd,
              audioCodec,
              sampleRate,
              channels,
              volume,
              removeAudio,
              outputName,
              overwrite,
              customArgs,
              selectedProfile,
            })
          }
        >
          Converter
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedConversionModal;
