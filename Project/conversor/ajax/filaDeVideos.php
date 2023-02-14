<?php
	include('conexao.php');
	$formato = $_GET['formato'];
	$nomeVideo = $_GET['nome'];
	$tamanho = $_GET['tamanho'];
	$codecVideo = $_GET['codecVideo'];
	$fps = $_GET['fps'];
	$taxaBitsVideo = $_GET['taxaBitsVideo'];
	$codecAudio = $_GET['codecAudio'];
	$canais = $_GET['canais'];
	$amostragem = $_GET['amostragem'];
	$taxaBitsAudio = $_GET['taxaBitsAudio'];
	$newNomeVideo = $_GET['newNomeVideo'];
	$habAudio = $_GET['habAudio'];
	$perfil = $_GET['perfil'];
	$ftempoInit = $_GET['ftempoInit'];
	$ftempoFinal = $_GET['ftempoFinal'];
	$tempoDuracao = $_GET['tempoDuracao'];

	$usuario = $_COOKIE['conversor'];

	$f = mysql_query("SELECT formato FROM formatos WHERE codigo = $formato");
	$resp = mysql_fetch_row($f);
	$verificaLista = mysql_query("SELECT codigo FROM conversoes WHERE convertido = 0 AND usuario = $usuario");
	
	if($habAudio)
		$audio = "Habilitado";
	else
		$audio = "Desabilitado";
	if($perfil == "")
		$perfil = "Personalizado";
	else
	{
		$p = mysql_query("SELECT nome FROM perfisvideo WHERE codigo = $perfil");
		$resp2 = mysql_fetch_row($p);
		$perfil = $resp2[0];
	}
	
	$f = mysql_query("SELECT formato FROM formatos WHERE codigo = $formato");
	$respF = mysql_fetch_row($f);
	$guarda = 0;
	$usuario = $_COOKIE["conversor"];
	/* $id = rand();
	
	return; */
	/* while($guarda == 0)
	{ */
		$id = rand();
		$guarda = mysql_query("INSERT INTO conversoes(formato,nomeOriginal,tamanho,codecVideo,fps,taxaBitsVideo,codecAudio,canais,amostragem,taxaBitsAudio,nome,habAudio,perfil,tempoInit,tempoFinal,id,tempoDuracao,usuario) VALUES('$respF[0]','$nomeVideo','$tamanho','$codecVideo','$fps','$taxaBitsVideo','$codecAudio','$canais','$amostragem','$taxaBitsAudio','$newNomeVideo','$habAudio','$perfil','$ftempoInit','$ftempoFinal','$id','$tempoDuracao','$usuario');");

	/* } */
?>
<table cellpadding='5' cellspacing='5' style='width: 100%;' id='item<?php echo"$id"; ?>'>
	<tr>
		<td style='width:20%;' class='itemConversao' title='<?php echo"$nomeVideo"; ?>'>
			 <?php
				if(strlen($nomeVideo) > 25)
					echo mb_substr($nomeVideo, 0, 25) . "...";
				else
					echo"$nomeVideo";
			 ?>
		</td>
		<td style='width:15%;' title='<?php echo"$perfil";?>' class='itemConversao'>
			<?php
				if(strlen($perfil) > 14)
					echo mb_substr($perfil, 0, 14) . "...";
				else
					echo"$perfil";
			 ?>
		</td>
		<td style='width:20%;' title='<?php echo"$newNomeVideo.$respF[0]"; ?>' class='itemConversao'>
			<?php
			echo"
			<div style='text-align: right;'>
				<label for='marcaUp$id'>
					<input type='checkbox' onchange='statusUpa(this.value);' value='$id' checked id='marcaUp$id' />&nbsp;&nbsp;Upload
				</label>
			</div>";
			if(strlen($newNomeVideo) > 20)
				echo mb_substr($newNomeVideo, 0, 20) . "....$respF[0]";
			else
				echo"$newNomeVideo.$respF[0]"; ?>
		</td>
		<td style='width:10%;' class='itemConversao'>
			<?php
				if($ftempoInit != "" || $ftempoFinal != "")
				{					
					echo"<span title='Tempo inicial'>TI: $ftempoInit </span><br />";
					echo"<span title='Tempo final'>TF: $ftempoFinal </span>";
				}
				else
					echo"Sem recorte";
			?>
		<td style='width:15%;' class='itemConversao'>
			<span id='estadoConversao<?php echo"$id"; ?>'>Aguardando!</span>
		<td style='width:10%;' class='itemConversao'>
			<span id='<?php echo"down$id"; ?>'>Não disponível</span>
		</td>
		<td style='width:10%;' class='itemConversao'>
			<button id='<?php echo"remov$id"; ?>' class='botaoBranco' onclick="removeFila('<?php echo $id; ?>','<?php echo"item$id"; ?>');">Remover</button>
		</td>
	</tr>
</table>
<?php
	 echo"|";
	 echo mysql_num_rows($verificaLista);
?>