<?php
	mysql_connect("localhost","eletel","eleteldb");
	mysql_select_db("eletel");
	mysql_query("SET NAMES utf8");
//	echo $_FILES["arquivo"]["name"];
	//$var = $_FILES["arquivo"]; 
	
	echo "Veio |".basename($_FILES["legenda"]["name"])."| daqui";
	
	$dir = "upload/";
	$arq = $dir . basename($_FILES["legenda"]["name"]);
	if(move_uploaded_file($_FILES["legenda"]["tmp_name"], $arq))
		echo "Pronto";
	else
		echo "Falha";
?>