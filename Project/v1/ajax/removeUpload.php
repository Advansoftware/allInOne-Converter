<?php
	include('conexao.php');
	$id = $_GET['id'];

	$up = mysql_query("UPDATE uploadsServer SET estado = 2 WHERE id=$id");
	
	$v = mysql_query("SELECT estado FROM uploadsServer WHERE estado = 0");
	echo mysql_num_rows($v);
?>
