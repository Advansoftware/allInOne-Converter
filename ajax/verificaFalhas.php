<?php
	include('conexao.php');
	$usuario = $_COOKIE["conversor"];
	$verifica = mysql_query("SELECT id FROM uploadsServer WHERE usuario = $usuario AND estado = 3 AND tentativas < 4 ORDER BY codigo ASC LIMIT 1");
	$resp = mysql_fetch_row($verifica);
	
	if(mysql_num_rows($verifica) != 0)
		echo"$resp[0]";
	else
		echo "0";
?>
