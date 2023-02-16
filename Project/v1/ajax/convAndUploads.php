<?php
	include("conexao.php");
	$usuario = $_COOKIE['conversor'];
	$conversoes = mysql_query("SELECT * FROM conversoes WHERE convertido = 0 AND usuario = $usuario");
	if(mysql_num_rows($conversoes))
	{
		echo"
		<br /><table cellpadding='5' cellspacing='5' style='width: 100%;'>
			<tr style='text-align: center;'>
				<td style='width:20%; border: 1px solid orange;'>Nome de entrada</td>
				<td style='width:15%; border: 1px solid orange;'>Perfil</td>
				<td style='width:20%; border: 1px solid orange;'>Nome de saída</td>
				<td style='width:10%; border: 1px solid orange;'>Recortes</td>
				<td style='width: 15%; border: 1px solid orange;'>Status</td>
				<td style='width: 10%; border: 1px solid orange;'>Download</td>
				<td style='width: 10%; border: 1px solid orange;'>Remover</td>
			</tr>
		</table>";
		for($i = 0; $i < mysql_num_rows($conversoes); $i++)
		{
			$resp = mysql_fetch_row($conversoes);
			echo"
			<table cellpadding='5' cellspacing='5' style='width: 100%;' id='item$resp[20]'>
				<tr>
					<td style='width:20%;' title='$resp[2]' class='itemConversao'>";
						if(strlen($resp[2]) > 25)
							echo mb_substr($resp[2], 0, 25) . "...";
						else
							echo" $resp[2]";
					echo"
					</td>
					<td style='width:15%;' title='$resp[17]' class='itemConversao'>";
						if(strlen($resp[17]) > 14)
							echo mb_substr($resp[17], 0, 14) . "...";
						else
							echo" $resp[17]";
					echo"
					</td>
					<td style='width:20%;' title='$resp[1].$resp[3]' class='itemConversao'>
					";
					if($resp[9] == 0)
						$checka = "checked";
					else
						$checka = "";
					echo"
					<div style='text-align: right;'>
						<label for='marcaUp$resp[20]'>
							<input type='checkbox' onchange='statusUpa(this.value);' value='$resp[20]' $checka id='marcaUp$resp[20]' />&nbsp;&nbsp;Upload
						</label>
					</div>";
						if(strlen($resp[1]) > 25)
							echo mb_substr($resp[1], 0, 25) . "...$resp[3]";
						else
							echo "$resp[1].$resp[3]";
					echo"
					</td>
					<td style='width:10%;' class='itemConversao'>
						<span title='Tempo inicial'>TI: $resp[18] </span><br />
						<span title='Tempo final'>TF: $resp[19] </span>
					<td style='width:15%;' class='itemConversao'>
						<span id='estadoConversao$resp[20]'>Aguardando!</span>
					<td style='width:10%;' class='itemConversao'>
						<span id='down$resp[20]'>Não disponível</span>
					</td>
					<td style='width:10%;' class='itemConversao'>
						<button id='remov$resp[20]' class='botaoBranco' onclick='removeFila(\"$resp[20]\",\"item$resp[20]\");'>Remover</button>	
					</td>
				</tr>
			</table>";
		}
	}
	else
		echo"<br /><center>Não há nenhuma conversão no momento.</center><br />";
?>