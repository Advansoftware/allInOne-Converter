<?php
	include('conexao.php');
	$iden = $_GET['iden'];
	$usuario = $_COOKIE['conversor'];
	if($iden == 0)
	{
		$idd = mysql_query("SELECT id FROM conversoes WHERE usuario = $usuario AND convertido = 0 ORDER BY codigo ASC LIMIT 1");
		$resp = mysql_fetch_row($idd);
		if(mysql_num_rows($idd))
			echo"$resp[0]|conv";
		else
			echo"0|0";
	}
	else
	{
		echo"$iden|up";
	}


///convertendo o ultimo do chapolin ep 96 webm
///na sequencia vem os the walking dead
///TALVEZ DE MERDA QUANDO PASSAR PARA O UPLOAD DO CHAPOLIN	
?>
