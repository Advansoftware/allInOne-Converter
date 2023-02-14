<?php

	$tempoInit = $_GET['tempoInit'];
	$tempoFinal = $_GET['tempoFinal'];
	$tempoDiferenca = 0;
	
	// Converte as duas datas para um objeto DateTime do PHP
	// PARA O PHP 5.3 OU SUPERIOR
	$tempoInit = DateTime::createFromFormat('H:i:s', $tempoInit);
	// PARA O PHP 5.2
	// $inicio = date_create_from_format('H:i:s', $inicio);
	 
	$tempoFinal = DateTime::createFromFormat('H:i:s', $tempoFinal);
	// $fim = date_create_from_format('H:i:s', $fim);
	 
	$tempoDiferenca = $tempoInit->diff($tempoFinal);
	 
	// Formata a diferença de horas para
	// aparecer no formato 00:00:00 na página
	//print $intervalo->format('%H:%I:%S');
	echo"$tempoFinal";
?>
