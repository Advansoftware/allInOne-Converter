<?php
	include('conexao.php');
	$usuario=$_COOKIE["conversor"];
	$ftp_server="189.84.192.20";
	$tipo = $_GET['tipo'];
//tipo pode vir com 0 ou 3. 0 é upload após conversao e 3 é upload que teve falha após a conversao
	$ftp_user_name="eleteltvdigital";
	$ftp_user_pass="itaeletel4282";
	$end = mysql_query("SELECT endereco,nome FROM uploadsServer WHERE estado = $tipo AND usuario = $usuario ORDER BY codigo ASC LIMIT 1");
	if(mysql_num_rows($end) != 0)
	{
		$resp = mysql_fetch_row($end);
		$file = "$resp[0]";//tobe uploaded
		$remote_file = "arquivos/videos/$resp[1]";
		// set up basic connection
		$conn_id = ftp_connect($ftp_server);

		// login with username and password
		$login_result = ftp_login($conn_id, $ftp_user_name, $ftp_user_pass);
		
		// upload a file

		if(ftp_put($conn_id, $remote_file, $file, FTP_BINARY))
		{
			echo "Upload completo|Upload completo";
			$up = mysql_query("UPDATE uploadsServer SET estado = 1 WHERE estado = $tipo AND usuario = $usuario ORDER BY codigo ASC LIMIT 1");
			exit;
		}
		else
		{
			$up = mysql_query("UPDATE uploadsServer SET estado = 3 WHERE estado = $tipo AND usuario = $usuario ORDER BY codigo ASC LIMIT 1");
			$tentativas = mysql_query("SELECT tentativas FROM uploadsServer WHERE usuario = $usuario AND estado = $tipo AND tentativas < 4 ORDER BY codigo ASC LIMIT 1");
			$respTent = mysql_fetch_row($tentativas);
			$upTentativas = mysql_query("UPDATE uploadsServer SET tentativas = $respTent[0] + 1 WHERE estado = $tipo AND usuario = $usuario AND tentativas < 4 ORDER BY codigo ASC LIMIT 1");
			$tent = $respTent[0] + 1;
			echo "Falha no upload|<span style='color: red; font-weight: bold;'>Falha no upload</span>|$tent";
			exit;
		}
		// close the connection
		ftp_close($conn_id);
	}
	else
		echo"conv|Pronto!";
?>