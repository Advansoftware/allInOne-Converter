<?php

/*
		DELETAR O UPLOAD DA LISTA E NÃO SIMPLESMENTE OCULTA-LO COM A VARIAVAL DE ESTADO PARA 4
*/
	include('conexao.php');
	$usuario = $_COOKIE['conversor'];
	$ups = mysql_query("SELECT * FROM uploadsServer WHERE estado = 3 AND usuario = $usuario");
	if(mysql_num_rows($ups) != 0)
	{
		$upd = mysql_query("UPDATE uploadsServer set tentativas = 0 WHERE usuario = $usuario AND estado = 3");
		echo"
		<table cellpadding='5' cellspacing='5' style='width: 100%;'>	
			<tr>
				<td colspan='7' style=' text-align: right;'><button class='botaoLaranja' id='botaoUpFalhas' onclick='verificaFalhas();' style='position: relative; right: 20%;'>Subir todos</button></td>
			</tr>
			<tr style='text-align: center;'>
				<td style='width:20%; border: 1px solid orange;'>
					Nome de entrada
				</td>
				<td style='width:15%; border: 1px solid orange;'>
					Perfil
				</td>
				<td style='width:20%; border: 1px solid orange;'>
					Nome de saída
				</td>
				<td style='width:10%; border: 1px solid orange;'>
					Recortes
				</td>
				<td style='width: 15%; border: 1px solid orange;'>
					Status
				</td>
				<td style='width: 10%; border: 1px solid orange;'>
					Download
				</td>
				<td style='width: 10%; border: 1px solid orange;'>
					Remover
				</td>
			</tr>";	
		for($i = 0; $i < mysql_num_rows($ups); $i++)
		{
			$resp = mysql_fetch_row($ups);
			echo"
			<tr id='fila$i'>
				<td style='width:20%;' title='$resp[5]' class='itemConversao'>";
					if(strlen($resp[5]) > 25)
						echo mb_substr($resp[5], 0, 25) . "...";
					else
						echo"$resp[5]";
				echo"</td>
				<td style='width:15%;' title='$resp[6]' class='itemConversao'>";
					if(strlen($resp[6]) > 14)
						echo mb_substr($resp[6], 0, 14) . "...";
					else
						echo"$resp[6]";
				echo"</td>
				<td style='width:15%;'title='$resp[4]'  class='itemConversao'>";
					if(strlen($resp[4]) > 25)
						echo mb_substr($resp[4], 0, 14) . "...";
					else
						echo"$resp[4]";					
				echo"</td>
				<td style='width:10%;' class='itemConversao'>
					$resp[7]
				</td>
				<td  style='width: 15%;' class='itemConversao'>
					<span id='falhaEstadoConversao$resp[3]'>Falha no upload!<br />
				</td>
				<td style='width:10%;' class='itemConversao'>
					<span id='e'><a href='ajax/$resp[1]' download='ajax/$resp[1]'>
						<img src='imagens/download.png' style='width: 40px;'></a>
					</span>
				</td>
				<td style='width:10%;' class='itemConversao'>
					<button id='removUp$resp[3]' class='botaoBranco' onclick='removeUpload(\"fila$i\",$resp[3]);'>Remover</button>
				</td>
			</tr>";
		}
		echo"</table><input type='hidden' id='4t'>|4t";
	}
	else
		echo"nada|";
?>