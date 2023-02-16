<?php
	include('conexao.php');
	$login = $_GET['login'];
	$cookie_name = "conversor";
	$cookie_value = "$login";
	setcookie($cookie_name, $cookie_value, time() + (86400 * 7), "/");
?>