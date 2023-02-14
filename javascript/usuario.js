function validaEntrada()
{
	var login = document.getElementById('login').value;
	if(login == 0)
		alert("Por favor, selecione um login válido!");
	else
		loga(login);
	return (0);
}

function loga(login)
{
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			location.reload();	
		}
	}
	car.open("GET","ajax/validaLogin.php?login="+login+"& antiCache=" + new Date().getTime(), true);
	car.send();
	return (0);
}

function logOut()
{
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			location.reload();	
		}
	}
	car.open("GET","ajax/logOut.php?antiCache=" + new Date().getTime(), true);
	car.send();
	return (0);
}