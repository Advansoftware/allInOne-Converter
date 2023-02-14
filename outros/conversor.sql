-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: 12-Nov-2017 às 06:01
-- Versão do servidor: 5.6.17
-- PHP Version: 5.5.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `conversor`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `canais`
--

CREATE TABLE IF NOT EXISTS `canais` (
  `codigo` int(11) NOT NULL AUTO_INCREMENT,
  `codigoFormato` int(11) NOT NULL,
  `canal` varchar(20) NOT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=26 ;

--
-- Extraindo dados da tabela `canais`
--

INSERT INTO `canais` (`codigo`, `codigoFormato`, `canal`) VALUES
(1, 1, 'estereo'),
(2, 1, 'mono'),
(3, 2, 'Original'),
(4, 2, '5.1'),
(5, 2, 'estereo'),
(6, 2, 'mono'),
(7, 3, 'Original'),
(8, 3, '5.1'),
(9, 3, 'estereo'),
(10, 4, 'Original'),
(11, 4, '5.1'),
(12, 4, 'estereo'),
(13, 4, 'mono'),
(15, 5, 'Original'),
(16, 5, '5.1'),
(17, 5, 'estereo'),
(18, 5, 'mono'),
(19, 6, 'estereo'),
(20, 6, 'mono'),
(21, 7, 'Original'),
(22, 7, '5.1'),
(23, 7, 'estereo'),
(24, 7, 'mono'),
(25, 8, 'estereo');

-- --------------------------------------------------------

--
-- Estrutura da tabela `codecvideo`
--

CREATE TABLE IF NOT EXISTS `codecvideo` (
  `codigo` int(11) NOT NULL AUTO_INCREMENT,
  `codigoFormato` int(11) NOT NULL,
  `codec` varchar(11) NOT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=21 ;

--
-- Extraindo dados da tabela `codecvideo`
--

INSERT INTO `codecvideo` (`codigo`, `codigoFormato`, `codec`) VALUES
(1, 1, 'h264'),
(2, 1, 'libxvid'),
(3, 1, 'mpeg4'),
(4, 2, 'h264'),
(5, 2, 'mpeg4'),
(6, 3, 'msmpeg4'),
(7, 3, 'wmv1'),
(8, 4, 'h263'),
(9, 4, 'mpeg4'),
(14, 5, 'h264'),
(15, 5, 'mpeg4'),
(16, 6, 'mpeg1video'),
(17, 6, 'mpeg2video'),
(18, 7, 'flv'),
(19, 7, 'h264'),
(20, 8, 'vp8');

-- --------------------------------------------------------

--
-- Estrutura da tabela `codec_audio`
--

CREATE TABLE IF NOT EXISTS `codec_audio` (
  `codigo` int(11) NOT NULL AUTO_INCREMENT,
  `codigoFormato` int(11) NOT NULL,
  `codec` varchar(20) NOT NULL,
  `tipo_de_bits` int(11) NOT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=22 ;

--
-- Extraindo dados da tabela `codec_audio`
--

INSERT INTO `codec_audio` (`codigo`, `codigoFormato`, `codec`, `tipo_de_bits`) VALUES
(1, 1, 'mp3', 1),
(2, 1, 'ac3', 2),
(3, 10, 'pcm', 0),
(4, 2, 'aac', 3),
(5, 2, 'ac3', 2),
(6, 2, 'mp3', 1),
(7, 30, 'wma lossless', 0),
(8, 3, 'wmav1', 5),
(9, 3, 'wmav2', 6),
(10, 30, 'wma pro', 0),
(11, 4, 'aac', 3),
(12, 40, 'amr', 0),
(13, 5, 'aac', 3),
(14, 5, 'mp3', 1),
(15, 5, 'ac3', 2),
(16, 5, 'flac', 7),
(17, 6, 'mp3', 1),
(18, 6, 'mp2', 4),
(19, 7, 'aac', 3),
(20, 7, 'mp3', 1),
(21, 8, 'vorbis', 8);

-- --------------------------------------------------------

--
-- Estrutura da tabela `formatos`
--

CREATE TABLE IF NOT EXISTS `formatos` (
  `codigo` int(11) NOT NULL AUTO_INCREMENT,
  `formato` varchar(10) NOT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=10 ;

--
-- Extraindo dados da tabela `formatos`
--

INSERT INTO `formatos` (`codigo`, `formato`) VALUES
(1, 'avi'),
(2, 'mp4'),
(3, 'wmv'),
(4, '3gp'),
(5, 'mkv'),
(6, 'mpeg'),
(7, 'flv'),
(8, 'webm'),
(9, 'mov');

-- --------------------------------------------------------

--
-- Estrutura da tabela `perfisvideo`
--

CREATE TABLE IF NOT EXISTS `perfisvideo` (
  `codigo` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `formato` int(11) NOT NULL,
  `tamanho` varchar(15) NOT NULL,
  `largura` varchar(15) NOT NULL,
  `altura` varchar(15) NOT NULL,
  `codecVideo` varchar(15) NOT NULL,
  `fps` varchar(15) NOT NULL,
  `tipoTaxaBitsVideo` varchar(2) NOT NULL,
  `taxaBitsVideo` varchar(15) NOT NULL,
  `codecAudio` varchar(15) NOT NULL,
  `canais` varchar(15) NOT NULL,
  `amostragem` varchar(15) NOT NULL,
  `taxaBitsAudio` varchar(11) NOT NULL,
  `habAudio` int(1) NOT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=13 ;

--
-- Extraindo dados da tabela `perfisvideo`
--

INSERT INTO `perfisvideo` (`codigo`, `nome`, `formato`, `tamanho`, `largura`, `altura`, `codecVideo`, `fps`, `tipoTaxaBitsVideo`, `taxaBitsVideo`, `codecAudio`, `canais`, `amostragem`, `taxaBitsAudio`, `habAudio`) VALUES
(1, 'tv_itajuba_MP4', 2, 'p', '852', '480', 'h264', '15', 'p', '400', '3', 'mono', '48000', '48', 1),
(2, 'TV ITAJUBA MP4 MOV', 2, 'p', '320', '240', 'mpeg4', '15', 'p', '150', '3', 'mono', '22050', '48', 1),
(3, 'TV ITAJUBA WEBM', 8, 'p', '852', '480', 'vp8', '15', 'p', ' 400', '8', 'estereo', '48000', '48', 1);

-- --------------------------------------------------------

--
-- Estrutura da tabela `taxa_bits_audio`
--

CREATE TABLE IF NOT EXISTS `taxa_bits_audio` (
  `codigo` int(11) NOT NULL AUTO_INCREMENT,
  `codigoCodec` int(11) NOT NULL,
  `tbits` varchar(15) NOT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=46 ;

--
-- Extraindo dados da tabela `taxa_bits_audio`
--

INSERT INTO `taxa_bits_audio` (`codigo`, `codigoCodec`, `tbits`) VALUES
(1, 1, '320'),
(2, 1, '256'),
(3, 1, '192'),
(4, 1, '160'),
(5, 1, '128'),
(6, 1, '96'),
(7, 1, '64'),
(8, 1, '48'),
(9, 1, '32'),
(10, 2, 'Automático'),
(11, 2, '224'),
(12, 2, '192'),
(13, 2, '160'),
(14, 2, '128'),
(15, 2, '112'),
(16, 2, '96'),
(17, 3, 'Automático'),
(18, 3, '576'),
(19, 3, '448'),
(20, 3, '320'),
(21, 3, '240'),
(22, 3, '160'),
(23, 3, '128'),
(24, 3, '96'),
(25, 4, '256'),
(26, 4, '192'),
(27, 4, '160'),
(28, 4, '128'),
(29, 4, '96'),
(30, 4, '64'),
(31, 4, '48'),
(32, 4, '32'),
(33, 8, '320'),
(34, 8, '256'),
(35, 8, '224'),
(36, 8, '192'),
(37, 8, '128'),
(38, 8, '112'),
(39, 8, '96'),
(40, 8, '64'),
(41, 8, '48'),
(42, 8, '32'),
(43, 8, '12'),
(44, 3, '64'),
(45, 3, '48');

-- --------------------------------------------------------

--
-- Estrutura da tabela `usuarios`
--

CREATE TABLE IF NOT EXISTS `usuarios` (
  `codigo` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Extraindo dados da tabela `usuarios`
--

INSERT INTO `usuarios` (`codigo`, `nome`) VALUES
(1, 'Tadeu');


CREATE TABLE `conversoes` (
x0  `codigo` int(11) NOT NULL AUTO_INCREMENT,
x1  `nome` varchar(200) DEFAULT NULL,
x2  `nomeOriginal` varchar(200) DEFAULT NULL,
x3  `formato` varchar(200) CHARACTER SET armscii8 DEFAULT NULL,
4  `tamanho` varchar(200) DEFAULT NULL,
5  `codecVideo` varchar(200) DEFAULT NULL,
6  `fps` varchar(200) DEFAULT NULL,
7  `canais` varchar(200) DEFAULT NULL,
8  `taxaBitsVideo` varchar(200) DEFAULT NULL,
9  `amostragem` varchar(200) DEFAULT NULL,
10  `codecAudio` varchar(200) DEFAULT NULL,
11  `taxaBitsAudio` varchar(200) DEFAULT NULL,
12  `tempoDuracao` varchar(200) DEFAULT NULL,
13  `convertido` int(11) DEFAULT '0',
14  `usuario` varchar(200) DEFAULT NULL,
x15  `habAudio` int(11) DEFAULT NULL,
16  `upar` int(11) DEFAULT NULL,
17  `perfil` varchar(200) DEFAULT NULL,
x18  `tempoInit` varchar(200) DEFAULT NULL,
x19  `tempoFinal` varchar(200) DEFAULT NULL,
x20  `id` int(11) DEFAULT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;


/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
