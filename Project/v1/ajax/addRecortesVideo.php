<?php
	$nome = $_GET['nome'];
//	echo"$endereco|";

?>
<div class='recortes'>
	<div class='aba' style='width: 20%;'>Recorte</div>
	<br />
	<table  style='width: 100%;' cellpadding='5' cellspacing='5' border='1px'>
		<tr>
			<td style='width: 50%; text-align: center;'>
				<span style='color: gray; line-height: 20px;'>Crie recortes. É muito simples, ao lado direito encontra-se um player onde você pode visualizar o video e orientar-se para determinar onde começa e onde termina o recorte!</span><br /><br />
				<center>				
				<table cellppading='5' cellspacing='5' style='width: 100%; border: 1px solid silver; box-shadow: 0px 0px 5px orange;'>
					<tr>
						<td style='text-align: right;'>
							Tempo inicial:
						</td>
						<td>
							<input type='text' value='00:00:00' maxlength='8' id='tempoInit' class='forms' style='width: 95%;' placeholder='Insira aqui o tempo onde iniciará o recorte' />
						</td>
					</tr>
					<tr>
						<td style='text-align: right;'>
							Tempo final:
						</td>
						<td>
							<input type='text' value='00:00:00' maxlength='8' id='tempoFinal' class='forms' style='width: 95%;' placeholder='Insira aqui o tempo onde terminará o recorte' />
						</td>
					</tr>
				</table>
				</center>	
			</td>
			<td style='width: 50%; background-color: black;'>
				<video id='player' controls style='width: 100%; height: 300px;'>
					<source src='<?php echo"/conversor/ajax/upload/$nome"; ?>'>
				</video>
			</td>
		</tr>
		<tr>
			<td><center>
				<table cellpadding='5' cellspacing='5'>
					<tr>	
						<td>			
							<button class='botaoLaranja' onclick='validaRecorte();'>Adicionar recorte</button>
						</td>
						<td>
							<button class='botaoLaranja' onclick="removeJanela('addRecortesVideo');">Cancelar</button>
						</td>
					</tr>				
				</table>
			</center>
			</td>
			<td style='text-align: center; font-weight: bold; font-size: 18px;'>
				<?php echo"Video de entrada: $nome"; ?>
			</td>
		</tr>
	</table>

</div>

