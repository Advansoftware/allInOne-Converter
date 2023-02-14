<?php
	include('conexao.php');
	$verifica = mysql_query("SELECT codigo FROM conversoes WHERE convertido = 0");
	echo mysql_num_rows($verifica);
?>