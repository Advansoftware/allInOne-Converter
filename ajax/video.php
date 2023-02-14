	<center>
		<div class='perfil'>
			<table cellpadding='5' cellspacing='5' style='box-shadow: 0px 0px 5px orange;'>
				<tr>
					<td>Perfil</td>
					<td>
						<select style=' padding:5px;' id='perfil' onchange="carregaPerfil('tamanho|codecVideo|fps|tipoTaxaBitsVideo|codecAudio|canais|amostragem|taxaBitsAudio|newPerfil|legenda|buttonRecortes|habAudio');">
							<option value="">Selecione um perfil</option>
							<?php
								include("conexao.php");
								$perfis = mysql_query("SELECT codigo, nome FROM perfisvideo ORDER BY codigo ASC");
								for($i = 0; $i < mysql_num_rows($perfis); $i++)
								{
									$respPerfis = mysql_fetch_row($perfis);
									echo"<option value='$respPerfis[0]'>$respPerfis[1]</option>";
								}
							?>
						</select>
					</td>
				</tr>
			</table>
		</div>
		<br />
		<fieldset style='width: 15%;'>
			<legend style='color: orange;text-align: center;'>Formato de saída</legend>
			<select id="formatos" style='padding: 5px;' onchange="carregaConfigsVideo(0);">
				<option value="">Selecione</option>
				<?php
					$formats = mysql_query("SELECT codigo,formato FROM formatos");
					for($i = 0; $i < mysql_num_rows($formats); $i++)
					{
						$resp = mysql_fetch_row($formats);			
						echo"<option value='$resp[0]' >$resp[1]</option>";
					}
				?>
			</select>
		</fieldset>
		<br />
	</center>
	<fieldset style='border: none;'>
		<legend style='position: relative; left: 5%;'>
			Opções avançadas
		</legend>
		<hr style='box-shadow: 0px 0px 5px orange;'>	
		<center>
			<table cellpadding='5' cellspacing='5'>
				<tr>
					<td>
						<fieldset style='text-align: center;'>
							<legend style='color: orange;'>Tamanho</legend>
							<select id="tamanho" style='padding: 5px;' onchange="tamPersonal();">
								<option value=' '>Selecione</option>
							</select>
						</fieldset>
					</td>
					<td>
						<fieldset style='text-align: center;'>
							<legend style='color: orange;'>Largura do quadro</legend>
							<input type='text' id='largura' disabled class='forms' size='8' value='' />
						</fieldset>
					</td>
					<td>
						<fieldset style='text-align: center;'>
							<legend style='color: orange;'>Altura do quadro</legend>
							<input type='text' id='altura' disabled class='forms' size='8' value='' />
						</fieldset>
					</td>
					<td>
						<fieldset style='text-align: center;'>
							<legend style='color: orange;'>Codec de video</legend>
							<select id='codecVideo' style='padding: 5px;'>
								<option value=' '>Selecione</option>
							</select>
						</fieldset>
					</td>							
				</tr>
				<tr>
					<td colspan='4'>
						<center>
							<table>
								<tr>
									<td>
										<fieldset style='text-align: center;'>
											<legend style='color: orange;'>Taxa de quadros FPS</legend>
											<select id='fps' style='padding: 5px;'>
												<option value=' '>Selecione</option>
											</select>
										</fieldset>
									</td>
									<td>
										<fieldset style='text-align: center;'>
											<legend style='color: orange;'>Tipo de taxa de bits</legend>
											<select id='tipoTaxaBitsVideo' style='padding: 5px;' onchange="taxaBitsVidPerso();">
												<option value=' '>Selecione</option>
											</select>
										</fieldset>
									</td>
									<td>
										<fieldset style='text-align: center;'>
											<legend style='color: orange;'>Taxa de bits (kbps)</legend>
											<input type='text' size='8' value='' id='taxaBitsVideo' class='forms' disabled />
										</fieldset>
									</td>
								</tr>
							</table>
						</center>
					</td>
				</tr>
			</table>
		</center>
		<br />
		<table style='position: relative; left: 5%;'>
			<tr>
				<td>
					<label for="habAudio">
						<form name="aud">															<!--SE ALTERAR AS IDS CONTIDA AQUI NESSE ONCHANGE, ALTERAR TAMBÉM NA FUNÇÃO CARREGAPERFIL-->															
							<input type='checkbox' name='habAudio' checked id='habAudio' onchange = "habilOpAudio('codecAudio|canais|amostragem|taxaBitsAudio');" />&nbsp;&nbsp;&nbsp;Aúdio
						</form>
					</label>
				</td>
			</tr>
		</table>
		<center>
			<table>
				<tr>
					<td>
						<fieldset style='text-align: center;'>
							<legend style='color: orange;'>Codec de aúdio</legend>
							<select onchange="tipoCodecAudio(0);" id='codecAudio' style='padding: 5px;'>
								<option value=' '>Selecione</option>
							</select>
						</fieldset>
					</td>
					<td>
						<fieldset style='text-align: center;'>
							<legend style='color: orange;'>Canais</legend>
							<select id='canais' style='padding: 5px;'>
								<option value=' '>Selecione</option>
							</select>
						</fieldset>
					</td>
					<td>
						<fieldset style='text-align: center;'>
							<legend style='color: orange;'>Taxa de amostragem</legend>
							<select id='amostragem' style='padding: 5px;'>
								<option value=' '>Selecione</option>
							</select>
						</fieldset>
					</td>
					<td>
						<fieldset style='text-align: center;'>
							<legend style='color: orange;'>Taxa de bits</legend>
							<select id='taxaBitsAudio' style='padding: 5px;'>
								<option value=' '>Selecione</option>
							</select>
						</fieldset>
					</td>
				</tr>
			</table>
			<br />
			<table>
				<tr>
					<td>
						<button id='newPerfil' id='salvaPerfilVideo' onclick="salvaPerfilVideo();" class='botaoLaranja'>Salvar como novo perfil</button>
					</td>
				</tr>
			</table>
			<br /><br />
			<table cellpadding='5' cellspacing='5' style='width: 85%;'>
				<tr style='border: 1px solid silver;'>
					<td style=' text-align: center; width: 15%;'>
						<input type='file' style='position: absolute; opacity: 0; z-index: 3; width: 150px; height: 30px;' name='legenda' id='legenda' onchange='infoLegend();' />
						<button id='addLegendas' class='botaoLaranja' style='width: 150px;'>Adicionar legenda</button>
					</td>
					<td style=' vertical-align: top; text-align: center; width: 20%;'>
						<input type='text' id='nomeLegend' class='forms' style='  text-align: center;' disabled  value='Nenhum arquivo carregado'/>
					</td>
					<td colspan='2' style='text-align: center; width: 12%;'>
						<button class='botaoCinza' style='width: 140px;' disabled id='botUploadLe' onclick="uploadLegenda('legenda','progressoLegend','prgL','botUploadLe');">Subir legenda</button>
					</td>
					<td style='width: 40%;'>
						<div style='border: 1px solid silver;  height: 26px;'>
								<div style='background-color: orange; height: 26px;width:0%;' id='progressoLegend'></div>
							</div>
					</td>
					<td id='prgL' style='width: 5%; text-align: center;'>000%</td>
				</tr>
				<!--SEPARA-->
				<tr>	
					<td colspan='3' style='text-align: right; width: 50%;' id='ultiRecor'>
						Nenhum recorte
					</td>
					<td colspan='3' style='text-align: left; width: 50%;'>
						<table>
							<tr>
								<td>
									<button id='buttonRecortes' class='botaoLaranja' onclick="addRecortesVideo();">Adicionar recortes</button>
								</td>
								<td>
									<form name='formMantRecor'>
										<label for='mantRecor'>
											&nbsp;<input type='checkbox' id='mantRecor' disabled /> Usar último recorte
										</label>
									</form>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
			<hr style='box-shadow: 0px 0px 5px orange;'>
		</center>
	</fieldset>