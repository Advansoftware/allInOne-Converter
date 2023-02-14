<?php
	include('conexao.php');
	$perfil = $_GET['perfil'];
	$tipo = $_GET['tipo'];
	if($tipo == "perfil")
	{
		$selecPerfil = mysql_query("SELECT formato,habAudio FROM perfisvideo WHERE codigo = $perfil");
		$resp = mysql_fetch_row($selecPerfil);
		echo"$resp[0]|$resp[1]|";
	}
	else
	{
		$selecPerfil = mysql_query("SELECT * FROM perfisvideo WHERE codigo = $perfil");
		$resp = mysql_fetch_row($selecPerfil);
		echo"$resp[3]|$resp[4]|$resp[5]|$resp[6]|$resp[7]|$resp[8]|$resp[9]|$resp[10]|$resp[11]|$resp[12]|$resp[13]|$resp[14]";
	}
/*
	
*/
?>
