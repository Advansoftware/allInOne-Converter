<?php
/* 	mysql_connect("localhost","eletel","eleteldb");
	mysql_select_db("eletel");
	mysql_query("SET NAMES utf8"); */
//	echo $_FILES["arquivo"]["name"];
	//$var = $_FILES["arquivo"]; 
	
	echo "Veio |".basename($_FILES["arquivo"]["name"])."| daqui";
	
	$dir = "upload/";
	$arq = $dir . basename($_FILES["arquivo"]["name"]);
	if(move_uploaded_file($_FILES["arquivo"]["tmp_name"], $arq))
		echo "Pronto";
	else
		echo "Falha";
?>