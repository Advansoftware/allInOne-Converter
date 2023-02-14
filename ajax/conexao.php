<?php
	error_reporting(0);
	//include('funcoes.php');
	session_start();
	ob_start();
	mysql_connect("server-mysql","appx-laravel","appx-laravel");
	mysql_select_db("appx-laravel");
	mysql_query("SET NAMES utf8");
	mb_internal_encoding('UTF8'); 
	mb_regex_encoding('UTF8'); //essas duas linhas é para usar com a função mb_substr

?>
