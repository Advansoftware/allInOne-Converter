<?php
	session_start();
	unset($_COOKIE["conversor"]);
	setcookie("conversor", "",  time() - 3600, "/"); //deleta o cookie
?>