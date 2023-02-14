<?php
	include('conexao.php');
	$usuario = $_COOKIE['conversor'];
	$tabela = $_GET['tabela'];
	if($tabela == "conv")
	{
		$busca = mysql_query("SELECT id FROM conversoes WHERE usuario = $usuario AND convertido = 0");
		$ids = "";
		for($i = 0; $i < mysql_num_rows($busca); $i++)
		{
			$resp = mysql_fetch_row($busca);
			$ids = $ids."$resp[0]-";
		}
		echo"$ids|";
	}
	else
	{
		$busca = mysql_query("SELECT id FROM uploadsServer WHERE usuario = $usuario AND estado = 3");
		$ids = "";
		for($i = 0; $i < mysql_num_rows($busca); $i++)
		{
			$resp = mysql_fetch_row($busca);
			$ids = $ids."$resp[0]-";
		}
		echo"$ids|up";
	}
?>