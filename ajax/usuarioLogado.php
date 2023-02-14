	<div id="conteiner" style='min-width: 800px;'>
		<div class='cabecalho'>
			<center><img src='imagens/logo.png' style='width: 30%;' /></center>
			<?php
				include('conexao.php');
				$usuario=$_COOKIE["conversor"];
				$vai = mysql_query("SELECT usuario FROM usuarios WHERE codigo = $usuario");
				$respVai = mysql_fetch_row($vai);
				echo"<span style='position: absolute;  right: 10px;'>$respVai[0]&nbsp;&nbsp;&nbsp;<button onclick='logOut();'class='botaoCinza' style='cursor: pointer;'>Sair</button></span>
				<br /><br />";
			?>
		</div>
		<div class='corpo'style='margin-top: 5px;'>
			<div class='uploads'>
				<div class='aba'>Upload</div>
				<br />
				<table style='position:relative; left: 10%; width: 75%;' cellpadding='5' cellspacing='5'>
					<tr>
						<td style=' text-align: center; width: 15%;'>
							<input style='position: absolute; opacity: 0;z-index: 3; width: 140px; height: 31px;' type='file' name='arquivo' id='arquivo' onchange='info();' />
							<button class='botaoLaranja' style='min-width: 140px;'>Adicionar arquivo</button>
						</td>
						<td style=' vertical-align: top;  width: 20%; text-align: center;'>
							<input type='text' id='nomeArq' class='forms' style='  text-align: center;' disabled  value='Nenhum arquivo carregado'/>
						</td>
						<td style=' text-align: center; vertical-align: top; width: 12%;'>
							<button style='min-width: 150px;' class='botaoCinza' id='botUpload' onclick="upload('arquivo','progresso','prg','botUpload');" disabled>Subir arquivo</button>
						</td>
						<td style='width: 40%; text-align: center;'>
							<div style='border: 1px solid silver;  height: 26px;'>
								<div style='background-color: orange; height: 26px;width:0%;' id='progresso'></div>
							</div>
						</td>
						<td id='prg' style='width: 5%;'>000%</td>
					</tr>
				</table>
				<br />
			</div>
			<div class='configConvert' style='margin-top: 5px;'>
				<div class='aba' style='width: 20%;'>Configurações da mídia</div>
				<br />
				<center>
					<table style='z-index: 5;'>
						<tr>
							<td>
								<button id='video' onclick="carrega('video','video|audio|imagem',0,'configs',0);" title='Converta para um formato de video' class='botaoLaranja'>Video</button>
							</td>
							<td>
								<button id='audio' onclick="carrega('audio','video|audio|imagem',1,'configs',0);" title='Converta para um formato de aúdio' class='botaoBranco'>Aúdio</button>
							</td>
							<td>
								<button id='imagem' onclick="carrega('imagem','video|audio|imagem',2,'configs',0);" title='converta para um formato de imagem' class='botaoBranco'>Imagem</button>
							</td>
						</tr>
					</table>
				</center>
				<div class='configs' id='configs'>
					<?php include("ajax/video.php"); ?>
				</div>
				<br />
				<center>
					<table cellpadding='5' cellspacing='5'>
						<tr>
							<td>Renomeie o arquivo</td>
							<td>
								<input type='text' id='newNomeVideo' style='width: 250px;' class='forms' title='Caso queira renomear o arquivo basta inserir o novo nome, se este campo ficar em branco o arquivo será renomeado pelo sistema' />
							<td>
								<button class='botaoLaranja' id='converter' onclick="validaConversao('formatos|tamanho|largura|altura|codecVideo|fps|tipoTaxaBitsVideo|taxaBitsVideo|codecAudio|canais|amostragem|taxaBitsAudio');">Adicionar a fila</button>
							</td>
							<td style='width: 10%;'>
								
							</td>
							<td>
								<button class='botaoLaranja' id='initConv' onclick="confirmaConversao();">Iniciar conversões</button>
							</td>
						</tr>
					</table>
				</center>
				<br />				
			</div>			
		</div>
		<div class='conversoes' style='margin-top: 5px;'>
			<div class='aba' style='width: 18%;'>Conversões e uploads</div>
			<div id='conversoes' style='max-height: 300px; overflow: auto;'>				
				<?php include('convAndUploads.php');?>
			</div>
		</div>
		<div class='conversoes' style='margin-top: 5px;'>
			<div class='aba' style='width: 18%;'>Uploads com falha</div><br />
			<div id='upFalhas' style='max-height: 300px; overflow: auto;'>			
				<br /><center>Todos os uploads foram realizados com sucesso.</center><br />
			</div>
		</div>
		<div class='rodape'></div>
	</div>