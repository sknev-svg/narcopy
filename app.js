/* ==================================================================
   NARCOPY - app.js
   ------------------------------------------------------------------
   Este arquivo controla TODA a lógica do sistema:
   login, cadastro, sessão, textos, links, fotos e arquivos.

   ARMAZENAMENTO USADO NESTA VERSÃO (tudo é LOCAL, no seu navegador):
   - localStorage -> usuários, sessão, textos e links
   - IndexedDB    -> fotos e arquivos (porque são maiores/binários)

   IMPORTANTE: isso NÃO é uma nuvem. Os dados ficam salvos apenas
   neste navegador, neste computador. Se você abrir o NARCOPY em
   outro computador ou outro navegador, os dados não estarão lá.
   No futuro, tudo isso pode ser substituído por um backend real
   com banco de dados e autenticação de verdade.
   ================================================================== */


/* ==================================================================
   UTILIDADES
   Funções pequenas usadas em várias partes do sistema.
   ================================================================== */

// Gera um identificador único simples (baseado em data/hora + número aleatório)
function gerarId() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

// Transforma um número de bytes em algo legível (KB, MB...)
function formatarTamanho(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Mostra uma mensagem (erro ou sucesso) dentro de um elemento da página
function mostrarMensagem(elementoId, texto, tipo) {
  var elemento = document.getElementById(elementoId);
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.className = "mensagem mostrar " + tipo; // tipo = "erro" ou "sucesso"
}

// Esconde a mensagem de um elemento
function esconderMensagem(elementoId) {
  var elemento = document.getElementById(elementoId);
  if (!elemento) return;
  elemento.className = "mensagem";
  elemento.textContent = "";
}

// Lê uma lista guardada no localStorage (retorna array vazio se não existir)
function lerLista(chave) {
  var dados = localStorage.getItem(chave);
  if (!dados) return [];
  try {
    return JSON.parse(dados);
  } catch (erro) {
    console.error("Erro ao ler " + chave + " do localStorage:", erro);
    return [];
  }
}

// Salva uma lista no localStorage
function salvarLista(chave, lista) {
  localStorage.setItem(chave, JSON.stringify(lista));
}


/* ==================================================================
   SESSÃO
   Controla se o usuário está logado e protege as páginas internas.
   ================================================================== */

// Verifica se existe uma sessão ativa. Se não existir, volta para o login.
// Deve ser chamada no topo de toda página protegida (inicio, fotos, textos, links, arquivos).
function verificarLogin() {
  var logado = localStorage.getItem("narcopy_logado");
  if (logado !== "true") {
    window.location.href = "index.html";
  }
}

// Encerra a sessão do usuário e volta para a tela de login.
function sair() {
  localStorage.removeItem("narcopy_logado");
  localStorage.removeItem("narcopy_usuarioAtual");
  window.location.href = "index.html";
}

// Retorna o nome do usuário logado no momento (ou "" se não houver)
function obterUsuarioAtual() {
  return localStorage.getItem("narcopy_usuarioAtual") || "";
}


/* ==================================================================
   CADASTRO (Criar acesso)
   ================================================================== */

// Cria uma nova conta de usuário e guarda no localStorage.
function criarAcesso(evento) {
  evento.preventDefault(); // impede o formulário de recarregar a página

  var usuario = document.getElementById("campoUsuarioCadastro").value.trim();
  var senha = document.getElementById("campoSenhaCadastro").value;
  var confirmarSenha = document.getElementById("campoConfirmarSenha").value;

  // Validações pedidas no projeto
  if (usuario === "") {
    mostrarMensagem("mensagemCadastro", "Digite um nome de usuário.", "erro");
    return;
  }
  if (senha === "") {
    mostrarMensagem("mensagemCadastro", "Digite uma senha.", "erro");
    return;
  }
  if (senha !== confirmarSenha) {
    mostrarMensagem("mensagemCadastro", "As senhas não coincidem.", "erro");
    return;
  }

  var usuarios = lerLista("narcopy_usuarios");

  // Verifica se o usuário já existe
  var jaExiste = usuarios.some(function (u) {
    return u.usuario.toLowerCase() === usuario.toLowerCase();
  });
  if (jaExiste) {
    mostrarMensagem("mensagemCadastro", "Esse usuário já existe. Escolha outro.", "erro");
    return;
  }

  // Salva o novo usuário
  // OBS: em uma versão real com backend, a senha NUNCA seria salva assim
  // (seria criptografada no servidor). Aqui é apenas uma versão local de estudo.
  usuarios.push({ usuario: usuario, senha: senha });
  salvarLista("narcopy_usuarios", usuarios);

  mostrarMensagem("mensagemCadastro", "Acesso criado com sucesso!", "sucesso");

  // Aguarda um instante para o usuário ler a mensagem e volta ao login
  setTimeout(function () {
    window.location.href = "index.html";
  }, 1500);
}


/* ==================================================================
   LOGIN
   ================================================================== */

// Confere usuário/senha digitados com os salvos e entra no sistema.
function entrar(evento) {
  evento.preventDefault();

  var usuario = document.getElementById("campoUsuarioLogin").value.trim();
  var senha = document.getElementById("campoSenhaLogin").value;

  var usuarios = lerLista("narcopy_usuarios");

  if (usuarios.length === 0) {
    mostrarMensagem("mensagemLogin", "Você ainda não possui um acesso. Crie sua conta primeiro.", "erro");
    return;
  }

  var encontrado = usuarios.find(function (u) {
    return u.usuario.toLowerCase() === usuario.toLowerCase();
  });

  if (!encontrado) {
    mostrarMensagem("mensagemLogin", "Você ainda não possui um acesso. Crie sua conta primeiro.", "erro");
    return;
  }

  if (encontrado.senha !== senha) {
    mostrarMensagem("mensagemLogin", "Usuário ou senha incorretos.", "erro");
    return;
  }

  // Login correto: cria a sessão
  localStorage.setItem("narcopy_logado", "true");
  localStorage.setItem("narcopy_usuarioAtual", encontrado.usuario);

  window.location.href = "inicio.html";
}


/* ==================================================================
   TEXTOS (anotações) - usa localStorage
   ================================================================== */

function salvarTexto(evento) {
  evento.preventDefault();

  var titulo = document.getElementById("campoTituloTexto").value.trim();
  var conteudo = document.getElementById("campoConteudoTexto").value.trim();

  if (titulo === "" || conteudo === "") {
    mostrarMensagem("mensagemTexto", "Preencha o título e o conteúdo.", "erro");
    return;
  }

  var textos = lerLista("narcopy_textos");
  textos.unshift({ id: gerarId(), titulo: titulo, conteudo: conteudo });
  salvarLista("narcopy_textos", textos);

  document.getElementById("formTexto").reset();
  esconderMensagem("mensagemTexto");
  mostrarTextos();
}

function mostrarTextos() {
  var lista = lerLista("narcopy_textos");
  var container = document.getElementById("galeriaTextos");
  if (!container) return;

  if (lista.length === 0) {
    container.innerHTML = '<p class="vazio">Nenhum texto salvo ainda.</p>';
    return;
  }

  container.innerHTML = "";
  lista.forEach(function (item) {
    var card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML =
      '<div class="item-titulo">' + escaparHtml(item.titulo) + "</div>" +
      '<div class="item-texto">' + escaparHtml(item.conteudo) + "</div>" +
      '<div class="item-acoes">' +
      '<button class="acao-excluir" onclick="excluirTexto(\'' + item.id + '\')">Excluir</button>' +
      "</div>";
    container.appendChild(card);
  });
}

function excluirTexto(id) {
  var textos = lerLista("narcopy_textos").filter(function (item) {
    return item.id !== id;
  });
  salvarLista("narcopy_textos", textos);
  mostrarTextos();
}


/* ==================================================================
   LINKS - usa localStorage
   ================================================================== */

function salvarLink(evento) {
  evento.preventDefault();

  var nome = document.getElementById("campoNomeLink").value.trim();
  var url = document.getElementById("campoUrlLink").value.trim();

  if (nome === "" || url === "") {
    mostrarMensagem("mensagemLink", "Preencha o nome e o endereço do link.", "erro");
    return;
  }

  // Garante que o link tenha "http://" ou "https://" para abrir corretamente
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  var links = lerLista("narcopy_links");
  links.unshift({ id: gerarId(), nome: nome, url: url });
  salvarLista("narcopy_links", links);

  document.getElementById("formLink").reset();
  esconderMensagem("mensagemLink");
  mostrarLinks();
}

function mostrarLinks() {
  var lista = lerLista("narcopy_links");
  var container = document.getElementById("galeriaLinks");
  if (!container) return;

  if (lista.length === 0) {
    container.innerHTML = '<p class="vazio">Nenhum link salvo ainda.</p>';
    return;
  }

  container.innerHTML = "";
  lista.forEach(function (item) {
    var card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML =
      '<div class="item-titulo">' + escaparHtml(item.nome) + "</div>" +
      '<div class="item-info">' + escaparHtml(item.url) + "</div>" +
      '<div class="item-acoes">' +
      '<a class="acao-abrir" href="' + escaparHtml(item.url) + '" target="_blank" rel="noopener">Abrir</a>' +
      '<button class="acao-excluir" onclick="excluirLink(\'' + item.id + '\')">Excluir</button>' +
      "</div>";
    container.appendChild(card);
  });
}

function excluirLink(id) {
  var links = lerLista("narcopy_links").filter(function (item) {
    return item.id !== id;
  });
  salvarLista("narcopy_links", links);
  mostrarLinks();
}


/* ==================================================================
   BANCO DE DADOS LOCAL (IndexedDB)
   Usado para FOTOS e ARQUIVOS, porque guardam arquivos binários
   maiores, e o IndexedDB lida melhor com isso do que o localStorage.
   ================================================================== */

var NARCOPY_DB_NOME = "narcopy_db";
var NARCOPY_DB_VERSAO = 1;

// Abre (ou cria, na primeira vez) o banco local com as duas "gavetas":
// uma para fotos e outra para arquivos.
function abrirBanco() {
  return new Promise(function (resolve, reject) {
    var pedido = indexedDB.open(NARCOPY_DB_NOME, NARCOPY_DB_VERSAO);

    pedido.onupgradeneeded = function (evento) {
      var db = evento.target.result;
      if (!db.objectStoreNames.contains("fotos")) {
        db.createObjectStore("fotos", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("arquivos")) {
        db.createObjectStore("arquivos", { keyPath: "id" });
      }
    };

    pedido.onsuccess = function (evento) {
      resolve(evento.target.result);
    };

    pedido.onerror = function (evento) {
      console.error("Erro ao abrir o banco local:", evento.target.error);
      reject(evento.target.error);
    };
  });
}


/* ==================================================================
   FOTOS - usa IndexedDB
   ================================================================== */

function salvarFoto(evento) {
  evento.preventDefault();

  var inputArquivo = document.getElementById("campoArquivoFoto");
  var titulo = document.getElementById("campoTituloFoto").value.trim();
  var arquivo = inputArquivo.files[0];

  if (!arquivo) {
    mostrarMensagem("mensagemFoto", "Selecione uma foto.", "erro");
    return;
  }
  if (titulo === "") {
    mostrarMensagem("mensagemFoto", "Digite um título para a foto.", "erro");
    return;
  }

  var registro = {
    id: gerarId(),
    titulo: titulo,
    tipo: arquivo.type,
    dados: arquivo // o próprio arquivo (Blob) é salvo diretamente no IndexedDB
  };

  abrirBanco().then(function (db) {
    var transacao = db.transaction("fotos", "readwrite");
    transacao.objectStore("fotos").add(registro);

    transacao.oncomplete = function () {
      document.getElementById("formFoto").reset();
      esconderMensagem("mensagemFoto");
      mostrarFotos();
    };
    transacao.onerror = function (evento) {
      console.error("Erro ao salvar foto:", evento.target.error);
      mostrarMensagem("mensagemFoto", "Erro ao salvar a foto.", "erro");
    };
  });
}

function mostrarFotos() {
  var container = document.getElementById("galeriaFotos");
  if (!container) return;

  abrirBanco().then(function (db) {
    var transacao = db.transaction("fotos", "readonly");
    var pedido = transacao.objectStore("fotos").getAll();

    pedido.onsuccess = function () {
      var lista = pedido.result || [];

      if (lista.length === 0) {
        container.innerHTML = '<p class="vazio">Nenhuma foto salva ainda.</p>';
        return;
      }

      container.innerHTML = "";
      lista.reverse().forEach(function (item) {
        var urlImagem = URL.createObjectURL(item.dados);
        var card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML =
          '<img src="' + urlImagem + '" alt="' + escaparHtml(item.titulo) + '">' +
          '<div class="item-titulo">' + escaparHtml(item.titulo) + "</div>" +
          '<div class="item-acoes">' +
          '<button class="acao-excluir" onclick="excluirFoto(\'' + item.id + '\')">Excluir</button>' +
          "</div>";
        container.appendChild(card);
      });
    };
  });
}

function excluirFoto(id) {
  abrirBanco().then(function (db) {
    var transacao = db.transaction("fotos", "readwrite");
    transacao.objectStore("fotos").delete(id);
    transacao.oncomplete = function () {
      mostrarFotos();
    };
  });
}


/* ==================================================================
   ARQUIVOS - usa IndexedDB
   ================================================================== */

function salvarArquivo(evento) {
  evento.preventDefault();

  var inputArquivo = document.getElementById("campoArquivo");
  var arquivo = inputArquivo.files[0];

  if (!arquivo) {
    mostrarMensagem("mensagemArquivo", "Selecione um arquivo.", "erro");
    return;
  }

  var registro = {
    id: gerarId(),
    nome: arquivo.name,
    tamanho: arquivo.size,
    tipo: arquivo.type,
    dados: arquivo
  };

  abrirBanco().then(function (db) {
    var transacao = db.transaction("arquivos", "readwrite");
    transacao.objectStore("arquivos").add(registro);

    transacao.oncomplete = function () {
      document.getElementById("formArquivo").reset();
      esconderMensagem("mensagemArquivo");
      mostrarArquivos();
    };
    transacao.onerror = function (evento) {
      console.error("Erro ao salvar arquivo:", evento.target.error);
      mostrarMensagem("mensagemArquivo", "Erro ao salvar o arquivo.", "erro");
    };
  });
}

function mostrarArquivos() {
  var container = document.getElementById("galeriaArquivos");
  if (!container) return;

  abrirBanco().then(function (db) {
    var transacao = db.transaction("arquivos", "readonly");
    var pedido = transacao.objectStore("arquivos").getAll();

    pedido.onsuccess = function () {
      var lista = pedido.result || [];

      if (lista.length === 0) {
        container.innerHTML = '<p class="vazio">Nenhum arquivo salvo ainda.</p>';
        return;
      }

      container.innerHTML = "";
      lista.reverse().forEach(function (item) {
        var url = URL.createObjectURL(item.dados);
        var card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML =
          '<div class="item-titulo">' + escaparHtml(item.nome) + "</div>" +
          '<div class="item-info">' + formatarTamanho(item.tamanho) + "</div>" +
          '<div class="item-acoes">' +
          '<a class="acao-abrir" href="' + url + '" target="_blank" rel="noopener">Abrir</a>' +
          '<button class="acao-excluir" onclick="excluirArquivo(\'' + item.id + '\')">Excluir</button>' +
          "</div>";
        container.appendChild(card);
      });
    };
  });
}

function excluirArquivo(id) {
  abrirBanco().then(function (db) {
    var transacao = db.transaction("arquivos", "readwrite");
    transacao.objectStore("arquivos").delete(id);
    transacao.oncomplete = function () {
      mostrarArquivos();
    };
  });
}


/* ==================================================================
   PROTEÇÃO CONTRA HTML MALICIOSO
   Evita que título/conteúdo digitados quebrem a página ou insiram
   código estranho, transformando caracteres especiais em texto puro.
   ================================================================== */

function escaparHtml(texto) {
  var div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}


/* ==================================================================
   INICIALIZAÇÃO
   Cada página tem um atributo data-pagina no <body>. Aqui decidimos
   o que fazer assim que a página carrega, de acordo com esse atributo.
   ================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  var pagina = document.body.getAttribute("data-pagina");

  // Mostra o nome do usuário logado no cabeçalho, quando existir o elemento
  var elementoUsuario = document.getElementById("nomeUsuarioLogado");
  if (elementoUsuario) {
    elementoUsuario.textContent = obterUsuarioAtual();
  }

  if (pagina === "login") {
    var formLogin = document.getElementById("formLogin");
    if (formLogin) formLogin.addEventListener("submit", entrar);
  }

  if (pagina === "cadastro") {
    var formCadastro = document.getElementById("formCadastro");
    if (formCadastro) formCadastro.addEventListener("submit", criarAcesso);
  }

  if (pagina === "inicio") {
    verificarLogin();
  }

  if (pagina === "textos") {
    verificarLogin();
    var formTexto = document.getElementById("formTexto");
    if (formTexto) formTexto.addEventListener("submit", salvarTexto);
    mostrarTextos();
  }

  if (pagina === "links") {
    verificarLogin();
    var formLink = document.getElementById("formLink");
    if (formLink) formLink.addEventListener("submit", salvarLink);
    mostrarLinks();
  }

  if (pagina === "fotos") {
    verificarLogin();
    var formFoto = document.getElementById("formFoto");
    if (formFoto) formFoto.addEventListener("submit", salvarFoto);
    mostrarFotos();
  }

  if (pagina === "arquivos") {
    verificarLogin();
    var formArquivo = document.getElementById("formArquivo");
    if (formArquivo) formArquivo.addEventListener("submit", salvarArquivo);
    mostrarArquivos();
  }
});
