<?php
	include('conexao.php');
	$formato = $_GET['formato'];
	$tamanho = $_GET['tamanho'];
	$largura = $_GET['largura'];
	$altura = $_GET['altura'];
	$codecVideo = $_GET['codecVideo'];
	$fps = $_GET['fps'];
	$tipoTaxaBitsVideo = $_GET['tipoTaxaBitsVideo'];
	$taxaBitsVideo = $_GET['taxaBitsVideo'];
	$codecAudio = $_GET['codecAudio'];
	$canais = $_GET['canais'];
	$amostragem = $_GET['amostragem'];
	$taxaBitsAudio = $_GET['taxaBitsAudio'];
	$newNome = $_GET['newNome'];
	$habAudio = $_GET['habAudio'];

	$verificaNome = mysql_query("SELECT nome FROM perfisvideo WHERE nome='$newNome'");
	if(!mysql_num_rows($verificaNome))
		$configPerfisVideo = mysql_query("INSERT INTO perfisvideo(nome,formato,tamanho,largura,altura,codecVideo,fps,tipoTaxaBitsVideo,taxaBitsVideo,codecAudio,canais,amostragem,taxaBitsAudio,habAudio) VALUES('$newNome','$formato','$tamanho','$largura','$altura','$codecVideo','$fps','$tipoTaxaBitsVideo','$taxaBitsVideo','$codecAudio','$canais','$amostragem','$taxaBitsAudio','$habAudio');");
	else
		echo"erro|";
	echo "$taxaBitsAudio|";
?>
