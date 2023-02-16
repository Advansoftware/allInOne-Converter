<?php
	$idUpload = $_GET['idUpload'];
	include('conexao.php');
	$busca = mysql_query("SELECT upar FROM conversoes WHERE id = $idUpload");
	$resp = mysql_fetch_row($busca);
	if($resp[0] == 0)
		$status = 4;
	else
		$status = 0;
	$muda = mysql_query("UPDATE conversoes SET upar = $status WHERE id = $idUpload");
?>