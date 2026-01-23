import { Link } from "react-router-dom";
import { useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Chip,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import LogoImage from "../assets/logo_white.png";

// Data
const screenshots = [
  { src: "/screenshots/screenshot-dashboard.png", title: "Dashboard Principal", desc: "Visão geral com atalhos rápidos para conversão e fila de processamento em tempo real." },
  { src: "/screenshots/screenshot-torrents.png", title: "Gerenciador de Torrents", desc: "Acompanhe velocidade de download/upload, progresso e número de peers conectados." },
  { src: "/screenshots/screenshot-upload.png", title: "Upload Intuitivo", desc: "Arraste e solte arquivos ou cole URLs e magnet links para iniciar conversões." },
  { src: "/screenshots/screenshot-torrent-detail.png", title: "Controle de Downloads", desc: "Pause, retome e selecione arquivos específicos para baixar de cada torrent." },
];

const features = [
  { icon: "🎥", title: "Conversão de Vídeos", desc: "Converta entre diversos formatos como MP4, WebM, AVI, MKV e muito mais." },
  { icon: "📥", title: "Download de URLs", desc: "Baixe vídeos do YouTube, Vimeo, TikTok e +1000 sites." },
  { icon: "🧲", title: "Cliente Torrent", desc: "Gerencie downloads via magnet links com estatísticas em tempo real." },
  { icon: "📺", title: "Streaming HLS", desc: "Preview de arquivos em tempo real durante conversões." },
  { icon: "⏳", title: "Fila Assíncrona", desc: "Processamento em background com status via WebSocket." },
  { icon: "🧱", title: "Microserviços", desc: "Arquitetura escalável com serviços independentes." },
];

const techStack = [
  { icon: "⚛️", name: "React + TypeScript" },
  { icon: "🔴", name: "Laravel API" },
  { icon: "🐍", name: "Python Services" },
  { icon: "🐳", name: "Docker Ready" },
  { icon: "🎬", name: "FFmpeg" },
  { icon: "💾", name: "MySQL + Redis" },
];

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    document.body.style.backgroundColor = "#0F0F0F";
    document.documentElement.style.backgroundColor = "#0F0F0F";
    return () => {
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
    };
  }, []);

  return (
    <Box sx={{ bgcolor: "#0F0F0F", color: "#fff", minHeight: "100vh", width: "100%", overflowX: "hidden" }}>
      {/* Navbar */}
      <AppBar position="fixed" sx={{ bgcolor: "rgba(15,15,15,0.95)", backdropFilter: "blur(10px)", boxShadow: "none", borderBottom: "1px solid #3F3F3F" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box component="img" src={LogoImage} alt="AllInOne Converter" sx={{ height: { xs: 20, md: 28 } }} />
          {!isSmall && (
            <Stack direction="row" spacing={3} sx={{ display: { xs: "none", md: "flex" } }}>
              <Typography component="a" href="#features" sx={{ color: "#aaa", textDecoration: "none", "&:hover": { color: "#fff" } }}>Recursos</Typography>
              <Typography component="a" href="#screenshots" sx={{ color: "#aaa", textDecoration: "none", "&:hover": { color: "#fff" } }}>Screenshots</Typography>
              <Typography component="a" href="#contribute" sx={{ color: "#aaa", textDecoration: "none", "&:hover": { color: "#fff" } }}>Contribuir</Typography>
            </Stack>
          )}
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<GitHubIcon />}
              href="https://github.com/Advansoftware/allInOne-Converter"
              target="_blank"
              sx={{ color: "#fff", borderColor: "#3F3F3F", display: { xs: "none", sm: "flex" } }}
            >
              GitHub
            </Button>
            <Button
              component={Link}
              to="/dashboard"
              variant="contained"
              size="small"
              startIcon={<RocketLaunchIcon />}
              sx={{ bgcolor: "#FF0000", "&:hover": { bgcolor: "#CC0000" } }}
            >
              {isSmall ? "Testar" : "Testar Agora"}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ pt: { xs: 12, md: 16 }, pb: { xs: 6, md: 10 }, px: 2 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label="🖥️ Self-Hosted & Gratuito" sx={{ bgcolor: "#FF0000", color: "#fff", fontWeight: 600 }} />
                  <Chip label="✅ Open Source" sx={{ bgcolor: "#282828", color: "#aaa", border: "1px solid #3F3F3F" }} />
                  <Chip label="🐳 Docker Ready" sx={{ bgcolor: "#282828", color: "#aaa", border: "1px solid #3F3F3F" }} />
                </Stack>
                <Typography variant={isMobile ? "h4" : "h2"} fontWeight={800} lineHeight={1.1}>
                  Converta <Box component="span" sx={{ color: "#FF0000" }}>qualquer mídia</Box> com um clique
                </Typography>
                <Typography variant="body1" sx={{ color: "#aaa", maxWidth: 500 }}>
                  Solução <strong style={{ color: "#fff" }}>100% gratuita e self-hosted</strong> para conversão de vídeos, 
                  download do YouTube e +1000 sites, gerenciamento de torrents e streaming HLS.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} pt={2}>
                  <Button
                    component={Link}
                    to="/dashboard"
                    variant="contained"
                    size="large"
                    startIcon={<RocketLaunchIcon />}
                    sx={{ bgcolor: "#FF0000", "&:hover": { bgcolor: "#CC0000" }, py: 1.5, px: 4 }}
                  >
                    Testar Agora
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<GitHubIcon />}
                    href="https://github.com/Advansoftware/allInOne-Converter"
                    target="_blank"
                    sx={{ color: "#fff", borderColor: "#3F3F3F" }}
                  >
                    Ver no GitHub
                  </Button>
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/screenshots/screenshot-dashboard.png"
                alt="Dashboard"
                sx={{
                  width: "100%",
                  borderRadius: 2,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                  border: "1px solid #3F3F3F",
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ bgcolor: "#1F1F1F", py: { xs: 6, md: 10 }, px: 2 }}>
        <Container maxWidth="lg">
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} textAlign="center" mb={1}>
            Recursos Poderosos
          </Typography>
          <Typography variant="body1" textAlign="center" sx={{ color: "#aaa", mb: 6, maxWidth: 600, mx: "auto" }}>
            Uma suíte completa de ferramentas para todas as suas necessidades de conversão e download
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card sx={{ bgcolor: "#282828", border: "1px solid #3F3F3F", height: "100%", "&:hover": { borderColor: "#FF0000" } }}>
                  <CardContent>
                    <Box sx={{ width: 50, height: 50, bgcolor: "#FF0000", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} mb={1}>{feature.title}</Typography>
                    <Typography variant="body2" sx={{ color: "#aaa" }}>{feature.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Screenshots Section */}
      <Box id="screenshots" sx={{ py: { xs: 6, md: 10 }, px: 2 }}>
        <Container maxWidth="lg">
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} textAlign="center" mb={1}>
            Veja em Ação
          </Typography>
          <Typography variant="body1" textAlign="center" sx={{ color: "#aaa", mb: 6 }}>
            Interface moderna com tema escuro e design intuitivo
          </Typography>
          <Grid container spacing={3}>
            {screenshots.map((ss, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Card sx={{ bgcolor: "#282828", border: "1px solid #3F3F3F", overflow: "hidden" }}>
                  <CardMedia component="img" image={ss.src} alt={ss.title} sx={{ width: "100%" }} />
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600}>{ss.title}</Typography>
                    <Typography variant="body2" sx={{ color: "#aaa" }}>{ss.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Architecture Section */}
      <Box sx={{ bgcolor: "#1F1F1F", py: { xs: 6, md: 10 }, px: 2 }}>
        <Container maxWidth="lg">
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} textAlign="center" mb={1}>
            Arquitetura Moderna
          </Typography>
          <Typography variant="body1" textAlign="center" sx={{ color: "#aaa", mb: 6 }}>
            Construído com microserviços independentes e Docker Compose
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {techStack.map((tech, i) => (
              <Grid item xs={6} sm={4} md={2} key={i}>
                <Card sx={{ bgcolor: "#282828", border: "1px solid #3F3F3F", textAlign: "center", py: 2 }}>
                  <Typography variant="h4">{tech.icon}</Typography>
                  <Typography variant="caption" sx={{ color: "#aaa" }}>{tech.name}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Open Source Banner */}
      <Box sx={{ background: "linear-gradient(135deg, rgba(255,0,0,0.1), rgba(255,0,0,0.05))", py: 6, px: 2, borderY: "1px solid #3F3F3F" }}>
        <Container maxWidth="md">
          <Typography variant="h5" fontWeight={700} textAlign="center" mb={2}>
            100% Open Source & Gratuito
          </Typography>
          <Typography variant="body1" textAlign="center" sx={{ color: "#aaa", mb: 3 }}>
            Este projeto é totalmente gratuito, self-hosted e aberto. Rode no seu próprio servidor com total privacidade!
          </Typography>
          <Stack direction="row" justifyContent="center">
            <Chip label="⚖️ Licenciado sob MIT License" sx={{ bgcolor: "#282828", color: "#fff", border: "1px solid #3F3F3F", py: 2, px: 1 }} />
          </Stack>
        </Container>
      </Box>

      {/* Donations Section */}
      <Box sx={{ py: 6, px: 2 }}>
        <Container maxWidth="sm">
          <Typography variant="h5" fontWeight={700} textAlign="center" mb={2}>
            ❤️ Apoie o Projeto
          </Typography>
          <Typography variant="body1" textAlign="center" sx={{ color: "#aaa", mb: 3 }}>
            O AllInOne Converter é 100% gratuito e sempre será. Considere fazer uma doação!
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button variant="contained" sx={{ bgcolor: "#FF5F5F" }}>❤️ Fazer Doação</Button>
            <Button variant="outlined" href="https://github.com/sponsors/Advansoftware" target="_blank" sx={{ color: "#fff", borderColor: "#3F3F3F" }}>
              GitHub Sponsors
            </Button>
            <Button variant="outlined" sx={{ color: "#fff", borderColor: "#3F3F3F" }}>PIX</Button>
          </Stack>
        </Container>
      </Box>

      {/* Contributors Section */}
      <Box id="contribute" sx={{ py: { xs: 6, md: 10 }, px: 2 }}>
        <Container maxWidth="md">
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} textAlign="center" mb={2}>
            Junte-se à Comunidade
          </Typography>
          <Card sx={{ bgcolor: "#1F1F1F", border: "1px solid #3F3F3F", p: { xs: 3, md: 5 }, textAlign: "center" }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Queremos Você Como Colaborador!</Typography>
            <Typography variant="body1" sx={{ color: "#aaa", mb: 3 }}>
              Seja desenvolvedor, designer ou entusiasta de DevOps, há um lugar para você no projeto.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
              <Button variant="contained" href="https://github.com/Advansoftware/allInOne-Converter/fork" target="_blank" sx={{ bgcolor: "#FF0000" }}>
                🍴 Fazer Fork
              </Button>
              <Button variant="outlined" href="https://github.com/Advansoftware/allInOne-Converter/issues" target="_blank" sx={{ color: "#fff", borderColor: "#3F3F3F" }}>
                🚩 Reportar Issue
              </Button>
              <Button variant="outlined" href="https://github.com/Advansoftware/allInOne-Converter/discussions" target="_blank" sx={{ color: "#fff", borderColor: "#3F3F3F" }}>
                💬 Discussões
              </Button>
            </Stack>
          </Card>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: "#1F1F1F", borderTop: "1px solid #3F3F3F", py: 4, px: 2 }}>
        <Container maxWidth="md">
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" justifyContent="center">
            <Box component="img" src={LogoImage} alt="AllInOne Converter" sx={{ height: 20 }} />
            <Stack direction="row" spacing={3}>
              <Typography component="a" href="https://github.com/Advansoftware/allInOne-Converter" target="_blank" sx={{ color: "#aaa", textDecoration: "none", fontSize: 14 }}>GitHub</Typography>
              <Typography component="a" href="https://github.com/Advansoftware/allInOne-Converter/blob/main/README.md" target="_blank" sx={{ color: "#aaa", textDecoration: "none", fontSize: 14 }}>Documentação</Typography>
              <Typography component="a" href="https://github.com/Advansoftware/allInOne-Converter/blob/main/LICENSE" target="_blank" sx={{ color: "#aaa", textDecoration: "none", fontSize: 14 }}>Licença MIT</Typography>
            </Stack>
          </Stack>
          <Typography variant="body2" textAlign="center" sx={{ color: "#666", mt: 2 }}>
            Desenvolvido com ❤️ usando Docker, Laravel, React e Python
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
