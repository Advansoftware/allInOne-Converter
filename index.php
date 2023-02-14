<!DOCTYPE HTML>
<html lang='pt-br'>
	<head>
		<meta charset='utf-8'>
		<title>Conversor FFMPEG</title>
		<link rel='stylesheet' type='text/css' href='estilos/geral.css' />
		<script type='text/javascript' src='javascript/principal.js'></script>
		<script type='text/javascript' src='javascript/usuario.js'></script>
	</head>
	<body id='geral' <?php if(isset($_COOKIE["conversor"]))echo"onload='upIncompletos(0);'";?>>
		
		<?php
			if(!isset($_COOKIE["conversor"]))
				include("ajax/login.php");
			else
				include("ajax/usuarioLogado.php");
		?>
	</body>
</html>
