<?php
	include("conexao.php");
	$codigoFormato = $_GET['codigoFormato'];
	echo"
		<option value=''>Original</option>
		<option value='1920x1080'>1920 x 1080</option>
		<option value='1280x720'>1280 x 720</option>
		<option value='720x576'>720 x 576</option>
		<option value='720x480'>720 x 480</option>
		<option value='640x480'>640 x 480</option>
		<option value='640x360'>640 x 360</option>
		<option value='320x240'>320 x 240</option>
		<option value='240x180'>240 x 180</option>
		<option value='p'>Personalizado</option>|";
	$codecVideo = mysql_query("SELECT codec FROM codecvideo WHERE codigoFormato = $codigoFormato");

	for($i = 0; $i < mysql_num_rows($codecVideo); $i++)
	{
		$resp = mysql_fetch_row($codecVideo);
		echo"<option value='$resp[0]'>$resp[0]</option>";
	}
	echo"|";
	echo"
		<option value=''>Original</option>
		<option value='60'>60 fps</option>
		<option value='50'>50 fps</option>
		<option value='30'>30 fps</option>
		<option value='25'>25 fps</option>
		<option value='24'>24 fps</option>
		<option value='15'>15 fps</option>
		<option value='12'>12 fps</option>|";
	
	echo"<option value=''>Automático</option>";
	echo"<option value='p'>Personalizado</option>|";
	
	$codecAudio = mysql_query("SELECT tipo_de_bits,codec FROM codec_audio WHERE codigoFormato = $codigoFormato");
	for($j = 0; $j < mysql_num_rows($codecAudio); $j++)
	{
		$resp2 = mysql_fetch_row($codecAudio);
		echo"<option value='$resp2[0]'>$resp2[1]</option>";
	}
	echo"|";
	$canais = mysql_query("SELECT canal FROM canais WHERE codigoFormato = $codigoFormato");
	for($k = 0; $k < mysql_num_rows($canais); $k++)
	{
		$resp3 = mysql_fetch_row($canais);
		if($resp3[0] == "Original")
			echo"<option value=''>$resp3[0]</option>";
		else
			echo"<option value='$resp3[0]'>$resp3[0]</option>";
	}
	echo"|";
	echo"
		<option value=''>Original</option>
		<option value='48000'>48000 Hz</option>
		<option value='44100'>44100 Hz</option>
		<option value='32000'>32000 Hz</option>
		<option value='24000'>24000 Hz</option>
		<option value='22050'>22050 Hz</option>
		<option value='16000'>16000 Hz</option>|";
		/* 	
						SEM SUPORTE			
			<option value='12000'>12000 Hz</option>
			<option value='11025'>11025 Hz</option>
			<option value='8000'>8000 Hz</option>
		*/
?>