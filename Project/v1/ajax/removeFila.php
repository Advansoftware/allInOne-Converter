<?php
	include('conexao.php');	
	$id = $_GET['id'];	
	$usuario = $_COOKIE['conversor'];
	$del = mysql_query("DELETE FROM conversoes WHERE id = $id");
	$flag = mysql_query("SELECT *  FROM conversoes WHERE convertido = 0 AND usuario = $usuario");
	
	echo mysql_num_rows($flag);
?>
