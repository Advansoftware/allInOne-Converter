<?php
	include("conexao.php");
	$codigoCodec = $_GET['codigoCodec'];
	$taxa = mysql_query("SELECT tbits FROM taxa_bits_audio WHERE codigoCodec = $codigoCodec");
	for($i = 0; $i < mysql_num_rows($taxa); $i++)
	{
		$resp = mysql_fetch_row($taxa);
		if($resp[0] == "Automático")
			echo"<option value=''>$resp[0]";
		else
			echo"<option value='$resp[0]'>$resp[0]";
		if($resp[0] != "Automático")
			echo" kbps</option>";
		else
			echo"</option>";

	}
	echo"|";
?>
