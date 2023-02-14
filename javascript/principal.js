/*
	SCRIPTS PRINCIPAIS DO CONVERSOR
*/
	
function alteraClasses(idBots,posicao)
{
	var racha = idBots.split("|");
	var tam = racha.length;
	for(var i = 0; i < tam; i++)
	{
		if(i != posicao) // onde posição indica quais botões serão habilitados
		{
			document.getElementById(racha[i]).className="botaoBranco";
			document.getElementById(racha[i]).disabled=false;
		}
		else
		{ //desabilita o botao que possui o conteudo exibido no local determinado
			document.getElementById(racha[i]).className="botaoLaranja";
			document.getElementById(racha[i]).disabled=true;
		}
	}
	return 0;
}

function carrega(arquivo,idBots,posicao,idLocal,foco)
{
	if(idBots != 0)
		alteraClasses(idBots,posicao);	
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		if(car.readyState == 4 || car.readyState == "complete")
		{
			document.getElementById(idLocal).innerHTML = car.responseText;
			if(foco != 0)
				document.getElementById(foco).focus();
		}
	}
	car.open("GET","ajax/"+arquivo+".php?antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

/*LEVANTA INFORMAÇÕES SOBRE O VIDEO,
	COMO ENDEREÇO NA MÁQUINA, NOME E EXTENSÃO*/
var extensao = "";
var nome = "";
var endereco ="";
function info()
{
	endereco = document.getElementById("arquivo").value;
	if(endereco != "")
	{
		var corta = endereco.split("\\");
		var tam = corta.length;
		nome = corta[tam - 1];
		var tipoExtensao = endereco.split(".");
		var tamExtensao = tipoExtensao.length;
		extensao = "."+tipoExtensao[tamExtensao - 1];
		if(extensao == ".mp4" || extensao == ".wmv" || extensao == ".flv" || extensao == ".avi" ||
		extensao == ".mkv" || extensao == ".mpeg" || extensao == ".mpg" || extensao == ".webm" ||
		extensao == ".3gp" || extensao == ".rmvb" || extensao == ".rm" || extensao == ".divx")
		{
			var n = nome.split(".");
			document.getElementById('nomeArq').value = nome;
			document.getElementById('newNomeVideo').value = n[0];
			document.getElementById('nomeArq').title = nome;
			document.getElementById('botUpload').className = "botaoLaranja";
			document.getElementById('botUpload').disabled = false;			
		}
		else
		{
			alert("Tipo de arquivo não suportado!");
			document.getElementById("arquivo").value = "";
		}
	}
	return 0;
}

function infoLegend()
{
	var endereco = document.getElementById("legenda").value;
	if(endereco != "")
	{
		var corta = endereco.split("\\");
		var tam = corta.length;
		var nome = corta[tam - 1];
		document.getElementById('nomeLegend').value = nome;
		var tipoExtensao = endereco.split(".");
		var tamExtensao = tipoExtensao.length;
		var extensao = tipoExtensao[tamExtensao - 1];
		document.getElementById('botUploadLe').className="botaoLaranja";
		document.getElementById('botUploadLe').disabled=false;
	}
	return 0;
}

var uploadVideo = 0;
//id do input file, id da barra de progresso, id do percentual upado
function upload(id,progresso,percentual,botUpload)
{
	document.getElementById(botUpload).disabled = true;
	document.getElementById(botUpload).className = "botaoCinza";
	var client = new XMLHttpRequest();  
	var file = document.getElementById(id);
	var formData = new FormData();
	formData.append(id, file.files[0]);
	client.upload.addEventListener("progress", function(ev) 
	{
		var pc = parseInt(ev.loaded / ev.total * 100);
		document.getElementById(progresso).value = pc;
		document.getElementById(percentual).innerHTML = pc + "%";
		var a = document.getElementById('progresso');
		a.style.width = pc + "%";
		if(pc >= 100)
		{
			alert("Arquivo carregado. Vamos converter?");
			document.getElementById(id).value = "";
			uploadVideo = 1;
		}
	}, false);
	client.open("POST", "ajax/upload.php", true);
	client.send(formData);
	return 0;
}

function uploadLegenda(id,progresso,percentual,botUpload)
{
	document.getElementById(botUpload).disabled=true;
	document.getElementById(botUpload).className="botaoCinza";
	var client = new XMLHttpRequest();  
	var file = document.getElementById(id);
	var formData = new FormData();
	formData.append(id, file.files[0]);
	client.upload.addEventListener("progress", function(ev) 
	{
		var pc = parseInt(ev.loaded / ev.total * 100);
		document.getElementById(progresso).value = pc;
		document.getElementById(percentual).innerHTML = pc+"%";
		var a = document.getElementById('progressoLegend');
		a.style.width=pc+"%";
		if(pc >= 100)
		{
			alert("Arquivo carregado. Vamos converter?");
			document.getElementById(id).value="";
		}
	}, false);
	client.open("POST", "ajax/uploadLegenda.php", true);
	client.send(formData);
	return 0;
}

function carregaConfigsVideo(tipo)
{
	var codigoFormato = document.getElementById("formatos").value;
	if(codigoFormato != "")
	{
		var car = new XMLHttpRequest();
		car.onreadystatechange = function()
		{
			var resp = car.responseText.split("|");
			if(car.readyState == 4 || car.readyState == "complete")
			{
				document.getElementById("tamanho").innerHTML = resp[0];
				document.getElementById("codecVideo").innerHTML = resp[1];
				document.getElementById("fps").innerHTML = resp[2];
				document.getElementById("tipoTaxaBitsVideo").innerHTML = resp[3];
				document.getElementById("codecAudio").innerHTML = resp[4];
				document.getElementById("canais").innerHTML = resp[5];
				document.getElementById("amostragem").innerHTML = resp[6];
				tipoCodecAudio(tipo);
				/*quando tipo = cp (carregar perfil) os campos abaixo não podem ser alterados, as configurações vêm do 
				banco, portanto o if abaixo é falso*/
				if(tipo != "cp")
				{
					document.getElementById('taxaBitsVideo').disabled = true;
					document.getElementById('largura').disabled = true;
					document.getElementById('largura').value = "";
					document.getElementById('altura').disabled = true;
					document.getElementById('altura').value = "";
					document.getElementById('taxaBitsVideo').value = "";
				}
			}
		}
		car.open("GET","ajax/configsVideo.php?codigoFormato="+codigoFormato+"& antiCache=" + new Date().getTime(), true);
		car.send();
	}
	return 0;
}

function tamPersonal()
{	
	var codigoFormato = document.getElementById("tamanho").value;
	if(codigoFormato == "p")
	{
		document.getElementById("largura").disabled = false;
		document.getElementById("altura").disabled = false;
		document.getElementById("largura").focus();
	}
	else
	{
		document.getElementById("largura").disabled = true;
		document.getElementById("altura").disabled = true;
		document.getElementById("largura").value = "";
		document.getElementById("altura").value = "";
	}
	return 0;
}

function taxaBitsVidPerso()
{
	var tipotaxabits = document.getElementById("tipoTaxaBitsVideo").value;
	if(tipotaxabits == "p")
	{
		document.getElementById("taxaBitsVideo").disabled = false;
		document.getElementById("taxaBitsVideo").focus();
	}
	else
		document.getElementById("taxaBitsVideo").disabled = true;
		document.getElementById("taxaBitsVideo").value = "";
	return 0;
}

function tipoCodecAudio(tipo)
{
	var codigoCodec = document.getElementById("codecAudio").value;
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			document.getElementById("taxaBitsAudio").innerHTML = resp[0];
			if(tipo == "cp")
				selectConfigsPerfil();			
		}
	}
	car.open("GET","ajax/configsTaxaBitsAudio.php?codigoCodec="+codigoCodec+"& antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

var estado2 = 0;
function habilOpAudio(ids)
{
	var rachaIds = ids.split("|");
	var tam = rachaIds.length;
	for(var i = 0; i < tam; i++)
	{
		if(estado2)
			document.getElementById(rachaIds[i]).disabled = false;
		else
			document.getElementById(rachaIds[i]).disabled = true;
	}
	estado2 =! estado2;
	return 0;
}

function validaConversao(ids)
{
	var formato = document.getElementById('formatos').value;
	var tamanho = document.getElementById('tamanho').value;
	var largura = document.getElementById('largura').value;
	var altura = document.getElementById('altura').value;
	var codecVideo = document.getElementById('codecVideo').value;
	var fps = document.getElementById('fps').value;
	var tipoTaxaBitsVideo = document.getElementById('tipoTaxaBitsVideo').value;
	var taxaBitsVideo = document.getElementById('taxaBitsVideo').value;
	var codecAudio = document.getElementById('codecAudio').value;
	var canais = document.getElementById('canais').value;
	var amostragem = document.getElementById('amostragem').value;
	var taxaBitsAudio = document.getElementById('taxaBitsAudio').value;
	
	var rachaIds = ids.split("|");
	var tam = rachaIds.length;
	var trava = true;
	if(nome == "")
		alert("Escolha um video para converter");
	else if(formato == "")
		alert("Escolha um formato de saída!");
	else	
	{
		if(confirm("Tem certeza que deseja adicionar a fila?"))
		{
			if(tamanho == "p")
			{
				if(largura == "")
				{
					alert("Insira um valor para a largura do quadro!");
					document.getElementById("largura").focus();
					trava = true;
				}
				else if(altura == "")
				{
					alert("Insira um valor para a altura do quadro!");
					document.getElementById("altura").focus();
					trava = true;
				}
				else
					trava = false;
			}
			else
				trava = false;
			if(tipoTaxaBitsVideo == "p" && !trava && taxaBitsVideo == "")
			{
				alert("Insira uma taxa de bits para o video a ser convertido!");
				document.getElementById('taxaBitsVideo').focus();
			}
			else if(document.aud.habAudio.checked)//PARA AÚDIO HABILITADO
			{
				if(!trava)
				{
					if(tamanho == "p")
						tamanho = largura+"x"+altura;
					else
					{
						if(tamanho == "")
							tamanho = "";
					}
					if(uploadVideo)					
						addFila(formato,extensao,tamanho,codecVideo,fps,taxaBitsVideo,codecAudio,canais,amostragem,taxaBitsAudio);
					else
						alert("Faça o upload do video clicando no botão acima Subir arquivo!");
				}
			}
			else if(!trava) //PARA AÚDIO DESABILITADO
			{
				codecAudio ="";//0
				canais = "";
				amostragem = "";
				taxaBitsAudio = "";
				if(tamanho == "p")
					tamanho = largura+"x"+altura;
				else
				{
					if(tamanho == "")
						tamanho = "";
				}
				if(uploadVideo)
					addFila(formato,extensao,tamanho,codecVideo,fps,taxaBitsVideo,codecAudio,canais,amostragem,taxaBitsAudio);
				else
					alert("Faça o upload do video clicando no botão acima Subir arquivo!");
			}
		}
	}
	return 0;
}

function confirmaConversao()
{
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			if(resp[0] == 0)			
				alert("Não há nenhuma conversão configurada");
			else
			{
				var conf = 0;
				conf = confirm("Ao clicar em ok, você não poderá configurar outras conversões enquanto as que estiverem na lista abaixo não forem completadas. Tem certeza que deseja continuar?");
				if(conf)
				{
					if(bloqueiaBotoesFila("remov","conv") == 1)
						mudaStatus(0);
				}
			}
		}
	}
	car.open("GET","ajax/verificaLista.php?antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

function bloqueiaBotoesFila(id,tabela)//id dos botoes e a tabela que possui os ids
{
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			var corta = resp[0].split("-");
			for(var i = 0; i < corta.length - 1; i++)
			{
				document.getElementById(id+corta[i]).disabled = true;
				if(id != "removUp")
					document.getElementById("marcaUp"+corta[i]).disabled = true;
			}
		}
	}
	car.open("GET","ajax/bloqueiaBotoesFila.php?tabela="+tabela+"& antiCache=" + new Date().getTime(), true);
	car.send();
	return (1);
}

function mudaStatus(iden)
{
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			if(resp[1] == "conv")
			{
				document.getElementById("estadoConversao"+resp[0]).innerHTML = "Convertendo <img src='imagens/carga.gif' />";
				converte(resp[0]);//ex.: 5280
			}
			else if(resp[1] == "up")
			{
				document.getElementById("estadoConversao"+resp[0]).innerHTML = "Upload <img src='imagens/carga.gif' />";
				uploadServer(resp[0]);//ex.: 5280
			}
			else
				upIncompletos(1);
		}
	}
	car.open("GET","ajax/mudaStatus.php?iden="+iden+"& antiCache=" + new Date().getTime(), true);
	car.send();
}

function converte(iden)
{
	var ids = "tamanho|codecVideo|largura|altura|taxaBitsVideo|fps|tipoTaxaBitsVideo|codecAudio|canais|amostragem|taxaBitsAudio|newPerfil|legenda|buttonRecortes|habAudio|perfil|formatos|video|audio|imagem|initConv|converter";
	var rachaIds = ids.split("|");
	var tam = rachaIds.length;
	for(var i = 0; i < tam; i++)
	{
		if(rachaIds[i] == "largura")
		{
			if(document.getElementById(rachaIds[i]).value == "")
				document.getElementById(rachaIds[i]).disabled = true;
			else
				document.getElementById(rachaIds[i]).disabled = false;
		}
		else if(rachaIds[i] == "altura")
		{
			if(document.getElementById(rachaIds[i]).value == "")
				document.getElementById(rachaIds[i]).disabled = true;
			else
				document.getElementById(rachaIds[i]).disabled = false;
		}
		else if(rachaIds[i] == "taxaBitsVideo")
		{
			if(document.getElementById(rachaIds[i]).value == "")
				document.getElementById(rachaIds[i]).disabled = true;
			else
				document.getElementById(rachaIds[i]).disabled = false;
		}
		else
			document.getElementById(rachaIds[i]).disabled = false;
	}
	var rachaIds = ids.split("|");
	var tam = rachaIds.length;
	for(var i = 0; i < tam; i++)
		document.getElementById(rachaIds[i]).disabled = true;
	var perfil = document.getElementById('perfil').value;
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			document.getElementById('down'+iden).innerHTML = resp[0];
			mudaStatus(iden);//nova ID
		}
	}
	car.open("GET","ajax/converte.php?antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

function uploadServer(iden)
{
	var tipo = 0;
	var func = "uploadServer";
	document.getElementById('estadoConversao'+iden).innerHTML = "Upload! <img src='imagens/carga.gif'>";	
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{	
			if(resp[0] == "Falha no upload")
				document.getElementById('estadoConversao'+iden).innerHTML = resp[1];			
			else if(resp[0] == "conv")
				document.getElementById('estadoConversao'+iden).innerHTML = resp[1];			
			else
				document.getElementById('estadoConversao'+iden).innerHTML = resp[0];
			mudaStatus(0);
		}
	}
	car.open("GET","ajax/uploadServer.php?tipo="+tipo+"& antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

function upIncompletos(sobe)
{
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			var ids = "tamanho|codecVideo|fps|tipoTaxaBitsVideo|codecAudio|canais|amostragem|taxaBitsAudio|newPerfil|legenda|buttonRecortes|habAudio|perfil|formatos|video|audio|imagem|arquivo|converter|initConv";
			var rachaIds = ids.split("|");
			var tam = rachaIds.length;
			if(resp[0] != "nada")
			{
				document.getElementById('upFalhas').innerHTML = resp[0];
				for(var i = 0; i < tam; i++)
					document.getElementById(rachaIds[i]).disabled = true;
			}
			else
			{
				document.getElementById('upFalhas').innerHTML ="<br /><center>Todos os uploads foram realizados com sucesso.</center><br />";
				for(var i = 0; i < tam; i++)
					document.getElementById(rachaIds[i]).disabled = false;
			}
			if(sobe == 1)
				verificaFalhas();
		}
	}
	car.open("GET","ajax/upIncompletos.php?antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

function removeUpload(idElem,id)//idElemen é do elemento html e id é o id do upload na tabela
{
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			if(resp[0] == 0)
			{	
				var ids = "tamanho|codecVideo|fps|tipoTaxaBitsVideo|codecAudio|canais|amostragem|taxaBitsAudio|newPerfil|legenda|buttonRecortes|habAudio|perfil|formatos|video|audio|imagem|arquivo|converter|initConv";
				var rachaIds = ids.split("|");
				var tam = rachaIds.length;
				for(var i = 0; i < tam; i++)
					document.getElementById(rachaIds[i]).disabled = false;
			}
			upIncompletos(0);
		}
	}
	car.open("GET","ajax/removeUpload.php?id="+id+"& antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

function removeFila(id,idElemen)
{
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			removeJanela(idElemen);
			if(resp[0] == 0)
				document.getElementById('conversoes').innerHTML = "<br /><center>Não há nenhuma conversão no momento.</center><br />";
			alert("Removido!");
		}
	}
	car.open("GET","ajax/removeFila.php?id="+id+"& antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

function verificaFalhas()
{
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			if(resp[0] != 0)
			{
				if(bloqueiaBotoesFila("removUp","up") == 1)//BLOQUEIA OS BOTOES DE REMOVER E OS CHECKBOX DE UPLOAD
					uploadServerIcompl(resp[0]);
			}
			else
			{
				upIncompletos(0);
				alert("Completo");
			}
		}
	}
	car.open("GET","ajax/verificaFalhas.php?antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

function uploadServerIcompl(iden)// --> resp[0]
{
	document.getElementById('botaoUpFalhas').disabled = true;
	var tipo = 3;
	document.getElementById('falhaEstadoConversao'+iden).innerHTML = "Upload! <img src='imagens/carga.gif'>";	
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			document.getElementById('falhaEstadoConversao'+iden).innerHTML = resp[1];
			//document.getElementById('estadoConversao'+iden).innerHTML = resp[1];
			if(resp[0] == "Falha no upload" && resp[2] < 4)
				setTimeout("aguardaRede("+iden+")",1000);
			else
				setTimeout("verificaFalhas()",1000);
		}
	}
	car.open("GET","ajax/uploadServer.php?tipo="+tipo+"& antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

var tempo = 11;

function aguardaRede(iden)
{
	tempo --;
	document.getElementById('falhaEstadoConversao'+iden).innerHTML = "Aguardando rede<br />"+tempo;
	if(tempo == 0)
	{
		tempo = 11;
		setTimeout("verificaFalhas()",1000);
	}
	else
		setTimeout("aguardaRede("+iden+")",1000);
	return 0;
}

function statusUpa(idUpload)//marca o video para apenas converter ou converter e subir
{
	janela("marcaUpAguard",3);
	document.getElementById('marcaUpAguard').innerHTML = "<center><div class='botaoLaranja' style='padding: 5px; position: relative;'>Aguarde...<div></center>";
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
			removeJanela("marcaUpAguard");
	}
	car.open("GET","ajax/statusUpa.php?idUpload="+idUpload+"& antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

function addFila(formato,extensao,tamanho,codecVideo,fps,taxaBitsVideo,codecAudio,canais,amostragem,taxaBitsAudio)
{
	var perfil = document.getElementById('perfil').value;
	var fhabAudio = 0;
	var confTempInit = "";
	var confTempFinal = "";
	var confTempDuracao = "";
	var newNomeVideo = document.getElementById("newNomeVideo").value;

	if(document.formMantRecor.mantRecor.checked)	
	{
		confTempInit = tempoInit;
		confTempFinal = tempoFinal;
		confTempDuracao = tempoDuracao;
	}
	else
	{
		confTempInit = "";
		confTempFinal = ""
		confTempDuracao = "";
	}
	if(!document.aud.habAudio.checked)
		fhabAudio = 0;
	else
		fhabAudio = 1;
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			/*var topo = "<table cellpadding='5' cellspacing='5' style='width: 100%;'><tr style='text-align: center;'>"+
			"<td style='width:20%; border: 1px solid orange;'>Nome de entrada</td><td style='width:15%; border: 1px solid orange;'>Perfil</td><td style='width:20%; border: 1px solid orange;'>Nome de saída</td><td style='width:10%; border: 1px solid orange;'>Recortes</td><td style='width: 15%; border: 1px solid orange;'>Status</td><td style='width: 10%; border: 1px solid orange;'>Download</td><td style='width: 10%; border: 1px solid orange;'>Remover</td>"+
			"</tr></table>";			
			if(resp[1] != 0)//PARA LIMPAR O QUE HÁ DENTRO DA DIV QUANDO INSERIR O PRIMEIRO ELEMENTO NA FILA
				document.getElementById("conversoes").innerHTML = document.getElementById('conversoes').innerHTML + resp[0];
			else
				document.getElementById("conversoes").innerHTML = "<br />"+topo+resp[0];*/
			listaConvs();
		}
	}
	car.open("GET","ajax/filaDeVideos.php?formato="+formato+"& nome="+nome+"& tamanho="+tamanho+"& codecVideo="+codecVideo+"& fps="+fps+"& taxaBitsVideo="+taxaBitsVideo+"& codecAudio="+codecAudio+"& canais="+canais+"& amostragem="+amostragem+"& taxaBitsAudio="+taxaBitsAudio+"& newNomeVideo="+newNomeVideo+"& habAudio="+fhabAudio+"& perfil="+perfil+"& ftempoInit="+confTempInit+"& ftempoFinal="+confTempFinal+"& tempoDuracao="+confTempDuracao+"& antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

function listaConvs()
{
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			document.getElementById("conversoes").innerHTML = "<br />"+resp[0];
		}
	}
	car.open("GET","ajax/convAndUploads.php?antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

function salvaPerfilVideo()
{
	var trava = false;
	if(document.getElementById('formatos').value == "")
	{
		alert("Selecione um formato de saída antes de continuar!");
		trava = true;
	}
	else if(document.getElementById('tamanho').value == "p")
	{
		if(document.getElementById('largura').value == "")
		{
			alert("Insira um valor para a largura do quadro!");
			document.getElementById('largura').focus();
			trava = true;
		}
		else if(document.getElementById('altura').value == "")
		{
			alert("Insira um valor para a altura do quadro!");
			document.getElementById('altura').focus();
			trava = true;
		}
		else
			trava = false;
	}
	if(document.getElementById('tipoTaxaBitsVideo').value == "p" && !trava &&
	document.getElementById('taxaBitsVideo').value == "")
	{
		alert("Insira uma taxa de bits para o video a ser convertido!");
		document.getElementById('taxaBitsVideo').focus();
		trava = true;
	}
	if(!trava)
	{
		janela("savePerfil",3);
		carrega("savePerfil",0,0,"savePerfil","newNome");
	}
	return 0;
}

function janela(iden,camada)
{
	var newJan = document.createElement("DIV");
	newJan.setAttribute("id",iden);
	newJan.style.zIndex = camada;
	newJan.className = "janFundo";
	document.getElementById('geral').style.overflow = "hidden";
	document.getElementById("conteiner").appendChild(newJan);
	return 0;
}

function removeJanela(id)
{
	var node = document.getElementById(id);
	node.parentNode.removeChild(node);
	document.getElementById('geral').style.overflow = "visible";
	return 0;
}

function valida()
{
	var newNome = document.getElementById('newNome').value;
	if(newNome == "")
	{
		alert("Por favor, insira um nome para o novo perfil!");
		document.getElementById('newNome').focus();
	}
	else
		cadastraPerfil(newNome);
	return 0;
}

function cadastraPerfil(newNome)
{
	var formato = document.getElementById('formatos').value;
	var tamanho = document.getElementById('tamanho').value;
	var largura = document.getElementById('largura').value;
	var altura = document.getElementById('altura').value;
	var codecVideo = document.getElementById('codecVideo').value;
	var fps = document.getElementById('fps').value;
	var tipoTaxaBitsVideo = document.getElementById('tipoTaxaBitsVideo').value;
	var taxaBitsVideo = document.getElementById('taxaBitsVideo').value;
	var codecAudio = document.getElementById('codecAudio').value;
	var canais = document.getElementById('canais').value;
	var amostragem = document.getElementById('amostragem').value;
	var taxaBitsAudio = document.getElementById('taxaBitsAudio').value;
	var habAudio = 0;
	alert(taxaBitsAudio);
	if(!document.aud.habAudio.checked)
	{
		codecAudio ="";//0
		canais = "";
		amostragem = "";
		taxaBitsAudio = "";
		habAudio = 0;
	}
	else
		habAudio = 1;
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			if(resp[0] == "erro")
				alert("Este nome de perfil já está sendo usado. Por favor, informe outro nome!");
			else
			{
				alert("Novo perfil criado com sucesso!");
				removeJanela("savePerfil");
			}
			alert(resp[0]);
		}
	}
	car.open("GET","ajax/cadastraPerfil.php?formato="+formato+"& tamanho="+tamanho+"& largura="+largura+"& altura="+altura+"& codecVideo="+codecVideo+"& fps="+fps+"& tipoTaxaBitsVideo="+tipoTaxaBitsVideo+"& taxaBitsVideo="+taxaBitsVideo+"& codecAudio="+codecAudio+"& canais="+canais+"& amostragem="+amostragem+"& taxaBitsAudio="+taxaBitsAudio+"& newNome="+newNome+"& habAudio="+habAudio+"& antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

function carregaPerfil(ids)
{
	var rachaIds = ids.split("|");
	var tam = rachaIds.length;
	var tipo = "perfil";
	var destrava = 0;
	var perfil = document.getElementById('perfil').value;
	if(perfil != "")
	{
		var car = new XMLHttpRequest();
		car.onreadystatechange = function()
		{
			var resp = car.responseText.split("|");
			if(car.readyState == 4 || car.readyState == "complete")
			{
				document.getElementById("formatos").value = resp[0];
				if(resp[1] == 1)
				{
					document.getElementById("habAudio").disabled = false;
					destrava = 1;
				}
				else
				{
					document.getElementById("habAudio").disabled = true;
					destrava = 0;
				}
				estado = 0;
				for(var i = 0; i < tam; i++)
				{
					if((i != 11 && i != 7 && i != 6 && i != 5 && i != 4) || destrava == 1)
						document.getElementById(rachaIds[i]).disabled = false;
				}					
				carregaConfigsVideo("cp");
			}
		}
		car.open("GET","ajax/carregaPerfil.php?perfil="+perfil+"& tipo="+tipo+"& antiCache=" + new Date().getTime(), true);
		car.send();
	}
	return 0;
}

function selectConfigsPerfil()
{
	var perfil = document.getElementById('perfil').value;
	var tipo = "configsPerfil";
	var car = new XMLHttpRequest();
	car.onreadystatechange = function()
	{
		var resp = car.responseText.split("|");
		if(car.readyState == 4 || car.readyState == "complete")
		{
			document.getElementById('tamanho').value = resp[0];
			if(resp[0] == "p")
			{
				document.getElementById('largura').disabled = false;
				document.getElementById('largura').value = resp[1];
				document.getElementById('altura').disabled = false;
				document.getElementById('altura').value = resp[2];
			}
			else
			{
				document.getElementById('largura').disabled = true;
				document.getElementById('largura').value = "";
				document.getElementById('altura').disabled = true;
				document.getElementById('altura').value = "";
			}
			document.getElementById('codecVideo').value = resp[3];
			document.getElementById('fps').value = resp[4];
			document.getElementById('tipoTaxaBitsVideo').value = resp[5];
			if(resp[5] == "p")
			{
				document.getElementById('taxaBitsVideo').value = resp[6]; 
				document.getElementById('taxaBitsVideo').disabled = false; 
			}
			else
			{
				document.getElementById('taxaBitsVideo').value = ""; 
				document.getElementById('taxaBitsVideo').disabled = true; 
			}
			if(resp[11] == 1)
			{
				document.getElementById('habAudio').checked = true;
				document.getElementById('codecAudio').value = resp[7];
				document.getElementById('canais').value = resp[8];
				document.getElementById('amostragem').value = resp[9];
				document.getElementById('taxaBitsAudio').value = resp[10];
				
			}
			else
				document.getElementById('habAudio').checked = true;
		}
	}
	car.open("GET","ajax/carregaPerfil.php?perfil="+perfil+"& tipo="+tipo+"& antiCache=" + new Date().getTime(), true);
	car.send();
	return 0;
}

function addRecortesVideo()
{
	if(!uploadVideo)
	{
		alert("Não foi detectado nenhum video para recorte! Verifique se já fez o upload do mesmo.");
		document.getElementById('arquivo').focus();
	}
	else
	{
		janela("addRecortesVideo",3);
		var car = new XMLHttpRequest();
		car.onreadystatechange = function()
		{
			var resp = car.responseText.split("|");
			if(car.readyState == 4 || car.readyState == "complete")
			{
				document.getElementById('addRecortesVideo').innerHTML = resp[0];
				document.getElementById('tempoInit').focus();
			}
		}
		car.open("GET","ajax/addRecortesVideo.php?nome="+nome+"& antiCache=" + new Date().getTime(), true);
		car.send();
	}
	return 0;
}

function intervaloTempo()
{
	var rachaInit = tempoInit.split(":");
	var rachaFinal = tempoFinal.split(":");
	var h = parseInt(rachaFinal[0]) - parseInt(rachaInit[0]);
	var m = parseInt(rachaFinal[1]) - parseInt(rachaInit[1]);
	var s = parseInt(rachaFinal[2]) - parseInt(rachaInit[2]);
	if(parseInt(rachaFinal[1]) < parseInt(rachaInit[1]))
	{
		h--;
		if(m < 0)
			m = m * (-1);
		m = 60 - m;
	}
	if(parseInt(rachaFinal[2]) < parseInt(rachaInit[2]))
	{
		m--;
		if(s < 0)
			s = s * (-1);
		s = 60 - s;
	}
	return h+":"+m+":"+s;
}

var tempoInit = "";
var tempoFinal = "";
var tempoDuracao = "";
function validaRecorte()
{
	tempoInit = document.getElementById('tempoInit').value;
	tempoFinal = document.getElementById('tempoFinal').value;
	if(tempoInit == "")
	{
		alert("Insira um valor de tempo inicial para o recorte");
		document.getElementById('tempoInit').focus();
	}
	else if(tempoFinal == "00:00:00" || tempoFinal == "")
	{
		alert("Insira um valor de tempo final para o recorte");
		document.getElementById('tempoFinal').focus();
	}
	else
	{
		removeJanela("addRecortesVideo");
		tempoDuracao = intervaloTempo(tempoInit,tempoFinal);
		document.getElementById('mantRecor').checked = true;
		document.getElementById('mantRecor').disabled = false;
		document.getElementById('ultiRecor').innerHTML = "<span style='color: orange;'>TI "+tempoInit+"</span> | <span style='color: orange;'>TF "+tempoFinal+"</span>";
	}
	return 0;
}