<center>
	<div class='savePerfil'>
		<div class='aba' style='width: 35%; left: 0%;'>Novo perfil</div>
		<br />
		<br />
		<table>
			<tr>
				<td style='padding: 10px; background-color: white; color: white; background-color: orange;'>
					Nome
				</td>
				<td>
					<input type='text' onkeyPress='if ((window.event ? event.keyCode : event.which) == 13){valida();}' id='newNome' style='outline: none; padding: 5px; height: 25px;' class='forms' />
				</td>
			</tr>
			<tr>
				<td colspan='2'>
					<center>
						<table cellpadding='5' cellspacing='5'>
							<tr>
								<td>
									<button class='botaoLaranja' onclick='valida();'>
										Salvar
									</button>
								</td>
								<td>
									<button class='botaoLaranja' onclick="removeJanela('savePerfil');">
										Cancelar
									</button>
								</td>
							</tr>
						</table>
					</center>
				</td>
			</tr>
		</table>
	</div>
</center>