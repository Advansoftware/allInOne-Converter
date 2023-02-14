<div>
	<center>
		<img src='imagens/logo.png' style='width: 30%; position: relative; top: 200px;' />
		<table border='1px' cellpadding='0' cellspacing='0' style='width:20%;position: relative; top: 250px;'>
			<tr>
				<td style='padding: 5px;'>
					<select id='login' class='forms' style='width:100%;'>
						<?php 
							include('conexao.php');
							echo"<option value='0'>Selecione</option>";
							$users = mysql_query("SELECT * FROM usuarios");
							
							for($i = 0; $i < mysql_num_rows($users); $i++)
							{
								$respUsers = mysql_fetch_row($users);
								echo"<option value='$respUsers[0]'>$respUsers[1]</option>";
							}
						?>
					</select>
					
				</td>
			</tr>
			<tr>
				<td style='text-align: center; padding: 5px;'>
					<button class='botaoLaranja' onclick='validaEntrada();'>Entrar</button>
				</td>
			</tr>
		</table>
	</center>
</div>