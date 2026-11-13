// Recursos compartilhados: funções pequenas, sem dependências ou servidor.
var LUZ = {};
(function () {
  "use strict";

  LUZ.reais = function (valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  function iniciarMenu() {
    var botao = document.querySelector(".menu-botao");
    var menu = document.getElementById("menu-principal");
    if (!botao || !menu) return;
    function fechar() {
      menu.classList.remove("aberto");
      botao.setAttribute("aria-expanded", "false");
    }
    botao.addEventListener("click", function () {
      botao.setAttribute("aria-expanded", String(menu.classList.toggle("aberto")));
    });
    menu.addEventListener("click", function (evento) {
      if (evento.target.closest("a")) fechar();
    });
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && menu.classList.contains("aberto")) {
        fechar(); botao.focus();
      }
    });
  }

  // Consulta somente os registros aprovados; nunca confia em preços do armazenamento.
  function encontrarProduto(nome) {
    var velas = typeof PRODUTOS === "undefined" ? [] : PRODUTOS;
    var kits = typeof KITS === "undefined" ? [] : KITS;
    var vela = velas.find(function (p) { return p.nome === nome; });
    if (vela) return { chave: "vela-" + vela.id, nome: vela.nome, preco: vela.preco };
    var kit = kits.find(function (p) { return "Kit " + p.nome === nome; });
    if (kit) return { chave: kit.slug, nome: "Kit " + kit.nome, preco: kit.preco };
    var combos = typeof COMBOS === "undefined" ? [] : COMBOS;
    var combo = combos.find(function (p) { return p.nome === nome; });
    return combo ? { chave: "combo-" + combo.slug, nome: combo.nome, preco: combo.preco, conteudo: combo.velas.map(function (p) { return { id: p.id, nome: p.nome, quantidade: 1 }; }) } : null;
  }

  var itens = [];
  var aviso, carrinho, lista, resumo, abrirCarrinho, concluir, origem;

  function avisar(texto) {
    aviso.textContent = texto;
  }

  function lerCarrinho() {
    try {
      var dados = JSON.parse(localStorage.getItem("carrinho") || "[]");
      if (!Array.isArray(dados)) return;
      dados.forEach(function (registro) {
        var produto = encontrarProduto(typeof registro === "string" ? registro : registro && registro.nome);
        var quantidade = typeof registro === "string" ? 1 : registro && registro.quantidade;
        if (!produto || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) return;
        var existente = itens.find(function (item) { return item.chave === produto.chave; });
        if (existente) existente.quantidade = Math.min(99, existente.quantidade + quantidade);
        else itens.push(Object.assign({}, produto, { quantidade: quantidade }));
      });
    } catch (erro) {
      avisar("Não foi possível recuperar o carrinho. Você pode começar uma nova seleção.");
    }
  }

  function salvarCarrinho() {
    try { localStorage.setItem("carrinho", JSON.stringify(itens)); }
    catch (erro) { avisar("Seu navegador não permitiu salvar. A seleção ficará apenas nesta página."); }
  }

  function criarBotao(texto, rotulo, acao) {
    var botao = document.createElement("button");
    botao.type = "button"; botao.textContent = texto;
    botao.setAttribute("aria-label", rotulo); botao.title = rotulo;
    botao.addEventListener("click", acao);
    return botao;
  }

  function alterarQuantidade(chave, diferenca) {
    var item = itens.find(function (p) { return p.chave === chave; });
    if (!item) return;
    item.quantidade = Math.max(1, Math.min(99, item.quantidade + diferenca));
    salvarCarrinho(); atualizarCarrinho();
    var linha = lista.querySelector('[data-chave="' + chave + '"]');
    if (linha) linha.querySelector(diferenca > 0 ? ".aumentar" : ".diminuir").focus();
  }

  function atualizarCarrinho() {
    lista.replaceChildren();
    var quantidade = 0, centavos = 0;
    itens.forEach(function (item) {
      quantidade += item.quantidade;
      centavos += Math.round(item.preco * 100) * item.quantidade;
      var linha = document.createElement("li"); linha.dataset.chave = item.chave;
      var nome = document.createElement("strong"); nome.textContent = item.nome;
      if (item.conteudo) {
        var conteudo = document.createElement("small");
        conteudo.textContent = item.conteudo.map(function (p) { return "1 × " + p.nome; }).join(" · ");
        nome.appendChild(document.createElement("br")); nome.appendChild(conteudo);
      }
      var preco = document.createElement("span"); preco.textContent = LUZ.reais(item.preco) + " / unidade";
      var controles = document.createElement("div"); controles.className = "quantidade-controles";
      var menos = criarBotao("−", "Diminuir " + item.nome, function () { alterarQuantidade(item.chave, -1); });
      menos.className = "diminuir"; menos.disabled = item.quantidade === 1;
      var numero = document.createElement("span"); numero.textContent = item.quantidade; numero.setAttribute("aria-label", "Quantidade");
      var mais = criarBotao("+", "Aumentar " + item.nome, function () { alterarQuantidade(item.chave, 1); });
      mais.className = "aumentar"; mais.disabled = item.quantidade === 99;
      var remover = criarBotao("×", "Remover " + item.nome, function () {
        itens = itens.filter(function (p) { return p.chave !== item.chave; });
        salvarCarrinho(); atualizarCarrinho();
        var proximo = lista.querySelector("button"); (proximo || carrinho.querySelector(".carrinho-fechar")).focus();
      });
      controles.append(menos, numero, mais, remover); linha.append(nome, preco, controles); lista.appendChild(linha);
    });
    if (!itens.length) {
      var vazio = document.createElement("li"); vazio.textContent = "Seu carrinho está esperando o primeiro presente.";
      lista.appendChild(vazio);
    }
    resumo.textContent = quantidade + (quantidade === 1 ? " item" : " itens") + " · Total: " + LUZ.reais(centavos / 100);
    abrirCarrinho.querySelector("span").textContent = quantidade;
    concluir.disabled = !itens.length;
  }

  function iniciarCarrinho() {
    var topo = document.querySelector(".cabecalho .container");
    if (!topo) return;
    aviso = document.createElement("p"); aviso.className = "aviso-geral"; aviso.setAttribute("role", "status");
    document.body.appendChild(aviso);
    abrirCarrinho = criarBotao("", "Abrir carrinho", function () {
      origem = document.activeElement; carrinho.showModal();
    });
    abrirCarrinho.className = "carrinho-abrir";
    abrirCarrinho.innerHTML = '<i class="fa-solid fa-bag-shopping" aria-hidden="true"></i><span>0</span>';
    topo.appendChild(abrirCarrinho);
    carrinho = document.createElement("dialog"); carrinho.className = "carrinho-modal";
    carrinho.setAttribute("aria-labelledby", "carrinho-titulo");
    carrinho.innerHTML = '<button type="button" class="carrinho-fechar" aria-label="Fechar carrinho">×</button><p class="sobretitulo">Presentes de Natal</p><h2 id="carrinho-titulo">Seu carrinho</h2><p>Compra demonstrativa: nenhum pagamento ou pedido real será realizado.</p><ul class="carrinho-lista"></ul><p class="carrinho-resumo" aria-live="polite"></p><button type="button" class="botao concluir-compra">Concluir compra demonstrativa</button><p class="compra-status" role="status"></p>';
    document.body.appendChild(carrinho);
    lista = carrinho.querySelector("ul"); resumo = carrinho.querySelector(".carrinho-resumo"); concluir = carrinho.querySelector(".concluir-compra");
    carrinho.querySelector(".carrinho-fechar").addEventListener("click", function () { carrinho.close(); });
    carrinho.addEventListener("close", function () { if (origem && origem.isConnected) origem.focus(); });
    carrinho.addEventListener("click", function (evento) { if (evento.target === carrinho) carrinho.close(); });
    concluir.addEventListener("click", function () {
      if (!itens.length) return;
      carrinho.querySelector(".compra-status").textContent = "Compra demonstrativa concluída! Nenhuma cobrança foi feita. " + resumo.textContent;
      itens = []; salvarCarrinho(); atualizarCarrinho(); carrinho.querySelector(".carrinho-fechar").focus();
    });
    lerCarrinho(); atualizarCarrinho();
    LUZ.adicionar = function (nome) {
      var produto = encontrarProduto(nome);
      if (!produto) return;
      var item = itens.find(function (p) { return p.chave === produto.chave; });
      if (item && item.quantidade === 99) { avisar("Limite de 99 unidades por produto."); return; }
      if (item) item.quantidade += 1;
      else itens.push(Object.assign({}, produto, { quantidade: 1 }));
      salvarCarrinho(); atualizarCarrinho(); carrinho.querySelector(".compra-status").textContent = "";
      avisar(nome + " adicionado ao carrinho.");
    };
    document.addEventListener("click", function (evento) {
      var botao = evento.target.closest("[data-add]");
      if (botao) LUZ.adicionar(botao.getAttribute("data-add"));
    });
  }

  // Campos declarados com limites; nada é enviado, armazenado ou interpretado como HTML.
  LUZ.validarContato = function (dados) {
    var limites = { nome: 100, email: 255, assunto: 120, mensagem: 1000 };
    var erros = {};
    Object.keys(limites).forEach(function (campo) {
      var valor = typeof dados[campo] === "string" ? dados[campo].trim() : "";
      if (!valor) erros[campo] = "Preencha este campo.";
      else if (valor.length > limites[campo]) erros[campo] = "Use até " + limites[campo] + " caracteres.";
      else if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(valor)) erros[campo] = "Remova os caracteres de controle.";
    });
    if (!erros.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email.trim())) erros.email = "Informe um e-mail válido, como nome@exemplo.com.";
    return erros;
  };

  function iniciarContato() {
    var formulario = document.getElementById("form-contato");
    if (!formulario) return;
    var campos = ["nome", "email", "assunto", "mensagem"];
    var status = document.getElementById("contato-status");
    function mostrarErro(campo, erro) {
      document.getElementById("erro-" + campo).textContent = erro || "";
      formulario.elements[campo].setAttribute("aria-invalid", String(Boolean(erro)));
    }
    formulario.addEventListener("submit", function (evento) {
      evento.preventDefault();
      var dados = {};
      campos.forEach(function (campo) { dados[campo] = formulario.elements[campo].value; });
      var erros = LUZ.validarContato(dados);
      campos.forEach(function (campo) { mostrarErro(campo, erros[campo]); });
      var primeiro = campos.find(function (campo) { return erros[campo]; });
      status.textContent = primeiro ? "Revise os campos indicados." : "Mensagem validada em modo demonstrativo. Nenhum dado foi enviado.";
      if (primeiro) formulario.elements[primeiro].focus();
    });
    campos.forEach(function (campo) {
      formulario.elements[campo].addEventListener("input", function () { mostrarErro(campo, ""); status.textContent = ""; });
    });
  }

  // Rolagem agenda uma única atualização; as duas camadas têm velocidades distintas.
  function iniciarParallax() {
    var camadas = document.querySelectorAll("[data-parallax]");
    if (!camadas.length) return;
    var reduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
    var agendado = false;
    function atualizar() {
      agendado = false;
      camadas.forEach(function (camada) {
        var cena = camada.closest(".cena") || camada.closest("section");
        if (!cena) return;
        var r = cena.getBoundingClientRect();
        // Na abertura mede a partir do topo; nas seções, a partir do centro da tela.
        var base = camada.closest(".cena") ? -r.top : (window.innerHeight / 2 - (r.top + r.height / 2));
        var deslocamento = reduzido.matches ? 0 : Math.max(-700, Math.min(700, base));
        camada.style.transform = "translate3d(0," + (deslocamento * Number(camada.dataset.parallax)) + "px,0)";
      });
    }
    window.addEventListener("scroll", function () {
      if (!agendado) { agendado = true; requestAnimationFrame(atualizar); }
    }, { passive: true });
    reduzido.addEventListener("change", atualizar); atualizar();
  }

  function iniciarSom() {
    var audio = document.getElementById("som-natal");
    var botao = document.getElementById("som-botao");
    var status = document.getElementById("som-status");
    if (!audio || !botao || !status) return;
    audio.volume = 0.15;
    function atualizar() {
      var tocando = !audio.paused;
      botao.setAttribute("aria-pressed", String(tocando));
      botao.setAttribute("aria-label", tocando ? "Pausar música de Natal" : "Tocar música de Natal");
      var icone = botao.querySelector("i");
      if (icone) icone.className = tocando ? "fa-solid fa-pause" : "fa-solid fa-music";
    }
    botao.addEventListener("click", function () {
      if (!audio.paused) { audio.pause(); return; }
      status.textContent = "";
      audio.play().catch(function () { status.textContent = "Não foi possível tocar a música neste navegador."; atualizar(); });
    });
    audio.addEventListener("play", atualizar); audio.addEventListener("pause", atualizar); atualizar();
  }

  iniciarMenu(); iniciarCarrinho(); iniciarContato(); iniciarParallax(); iniciarSom();
  var ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();
})();

// Home: abertura do presente (por clique) e vitrine (slideshow automático), independentes.
(function () {
  // Abertura do presente
  var botao = document.getElementById("abrir-presente");
  var cena = document.getElementById("cena-presente");
  var revelacao = document.getElementById("revelacao");
  var reduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
  var timer;
  if (botao && cena && revelacao) {
    botao.addEventListener("click", function () {
      var abrir = !cena.classList.contains("aberta");
      clearTimeout(timer);
      cena.classList.toggle("aberta", abrir);
      botao.setAttribute("aria-expanded", abrir ? "true" : "false");
      botao.textContent = abrir ? "Fechar o presente" : "Abrir um presente";
      if (abrir) {
        timer = setTimeout(function () { revelacao.hidden = false; }, reduzido.matches ? 0 : 2600);
      } else {
        revelacao.hidden = true;
      }
    });
  }

  // Vitrine
  var vitrine = document.querySelector(".vitrine");
  if (!vitrine) return;
  var slides = vitrine.querySelectorAll(".vitrine-slide");
  var pontos = vitrine.querySelector(".vitrine-pontos");
  var pausa = vitrine.querySelector(".vitrine-pausa");
  if (!slides.length || !pontos || !pausa) return;
  var atual = 0, intervalo = null, pausado = false;

  slides.forEach(function (s, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Mostrar vela " + (i + 1));
    b.addEventListener("click", function () { mostrar(i); reiniciar(); });
    pontos.appendChild(b);
  });

  function mostrar(i) {
    atual = (i + slides.length) % slides.length;
    slides.forEach(function (s, j) { s.hidden = j !== atual; });
    pontos.querySelectorAll("button").forEach(function (b, j) {
      b.setAttribute("aria-current", j === atual ? "true" : "false");
    });
  }
  function iniciar() { if (!pausado && !reduzido.matches && !intervalo) intervalo = setInterval(function () { mostrar(atual + 1); }, 5000); }
  function parar() { clearInterval(intervalo); intervalo = null; }
  function reiniciar() { parar(); iniciar(); }

  vitrine.querySelectorAll(".vitrine-seta").forEach(function (b) {
    b.addEventListener("click", function () { mostrar(atual + Number(b.getAttribute("data-dir"))); reiniciar(); });
  });
  pausa.addEventListener("click", function () {
    pausado = !pausado;
    pausa.setAttribute("aria-label", pausado ? "Retomar troca automática" : "Pausar troca automática");
    pausa.innerHTML = '<i class="fa-solid fa-' + (pausado ? "play" : "pause") + '" aria-hidden="true"></i>';
    pausado ? parar() : iniciar();
  });
  vitrine.addEventListener("mouseenter", parar);
  vitrine.addEventListener("mouseleave", iniciar);
  vitrine.addEventListener("focusin", parar);
  vitrine.addEventListener("focusout", function (e) { if (!vitrine.contains(e.relatedTarget)) iniciar(); });

  mostrar(0);
  reduzido.addEventListener("change", function () { parar(); iniciar(); });
  iniciar();
})();
