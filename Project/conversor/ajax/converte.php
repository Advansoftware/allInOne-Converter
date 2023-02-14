<?php
	include('conexao.php');
	$usuario=$_COOKIE["conversor"];
	$conv = mysql_query("SELECT * FROM conversoes WHERE convertido = 0 AND usuario = $usuario ORDER BY codigo ASC LIMIT 1");
	$respConv = mysql_fetch_row($conv);
	
	if($respConv[18] != "")
	{
		$tempoInit = "-ss $respConv[18]";
		$tempoDuracao = "-t $respConv[21]";
	}
	
	if($perfil != "")
	{
		$p = mysql_query("SELECT nome FROM perfisvideo WHERE codigo = $perfil");
		$rp = mysql_fetch_row($p);
	}
	
	if($respConv[15] == 0)
		$mute = "-an ";
	else 
		$mute = " ";
	if($respConv[1] == "")
		$newNomeVideo = rand();
	else
		$newNomeVideo = $respConv[1];

	$ftm = "K";//FATOR MULTIPLICATIVO
	if($respConv[10] != "")
		$taxaBitsVideo = "-b:v $respConv[10]$ftm";

	if($respConv[8] != "")
		$fps = "-r $respConv[8]";
	
	if($respConv[4] != "")
		$tamanho = "-s $respConv[4]";
	
	if($respConv[7] != "")
		$codecVideo = "-vcodec $respConv[7]";
	
	if($respConv[14] != "")
		$taxaBitsAudio = "-ab $respConv[14]$ftm";
	
	if($respConv[13] != "")
		$amostragem = "-ar $respConv[13]";
	
	$a = " -strict -2";	
	if($respConv[11] != "")
	{
		//$codecAudio = "-acodec $codecAudio$a";
		$codecA = mysql_query("SELECT codec FROM codec_audio WHERE tipo_de_bits = $respConv[11] LIMIT 1");
		$resp = mysql_fetch_row($codecA);
		$codecAudio = "-acodec $resp[0]$a";
	}
	
	if($respConv[12] == "mono")
		$canais = "-ac 1";
	else if($respConv[12] == "estereo")
		$canais = "-ac 2";
	else
		$canais = "";
//	../../../../../mnt/documentos2/
	$sistema = PHP_OS; //identifica o sistema operacional
	if($sistema == "WINNT")
		$ffmpeg = "c:\\ffmpeg\\bin\\ffmpeg.exe";
	else
		$ffmpeg = "ffmpeg";
	
	system("$ffmpeg $tempoInit $tempoDuracao -i \"upload/$respConv[2]\" -y $taxaBitsVideo $fps $tamanho $codecVideo $taxaBitsAudio $amostragem $canais $mute $codecAudio \"convertidos/$newNomeVideo.$respConv[3]\"");
	$usuario=$_COOKIE["conversor"];
	$converte = mysql_query("UPDATE conversoes SET convertido = 1 WHERE codigo = $respConv[0]");
	$grava = mysql_query("INSERT INTO uploadsServer(endereco,estado,id,nome,nomeOriginal,recortes,perfil,usuario) VALUES('convertidos/$newNomeVideo.$respConv[3]','$respConv[9]','$respConv[20]','$newNomeVideo.$respConv[3]','$respConv[2]','TI $temp <br /> TF $tempoFinal','$respConv[17]','$usuario');");
	echo"<a href='ajax/convertidos/$newNomeVideo.$respConv[3]' download='ajax/convertidos/$newNomeVideo.$respConv[3]'><img src='imagens/download.png' style='width: 40px;'></a>|$grava";
?>
