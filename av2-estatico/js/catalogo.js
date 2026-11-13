// Catálogo de velas: busca, filtros, "Carregar mais" e ficha com carrossel.
(function () {
  var POR_VEZ = 12;
  var grade = document.getElementById("grade-velas");
  var busca = document.getElementById("busca");
  var familia = document.getElementById("filtro-familia");
  var tamanho = document.getElementById("filtro-tamanho");
  var contador = document.getElementById("contador");
  var vazio = document.getElementById("vazio");
  var mais = document.getElementById("carregar-mais");
  var limpar = document.getElementById("limpar-filtros");
  if (!grade || !busca || !familia || !tamanho || !contador || !vazio || !mais || !limpar || typeof PRODUTOS === "undefined") return;
  var visiveis = POR_VEZ, filtradas = PRODUTOS;

  function semAcento(t) { return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }

  function card(p) {
    var foto = p.fotoPrincipalPronta || p.fotosProntas
      ? '<img src="' + p.imagem + '" width="800" height="800" loading="lazy" alt="' + p.nome + ': vela inteira com rótulo Luz de Canela">'
      : '<span class="marcador">Foto em produção</span>';
    return '<article class="cartao cartao-vela">' +
      '<button type="button" class="cartao-foto" data-ficha="' + p.id + '" aria-label="Abrir ficha de ' + p.nome + '">' + foto + '</button>' +
      '<p class="cartao-meta">' + p.categoria + ' · ' + p.tamanho + '</p>' +
      '<h3><button type="button" class="link-ficha" data-ficha="' + p.id + '">' + p.nome + '</button></h3>' +
      '<p class="notas">' + p.notas + '</p>' +
      '<p class="preco">' + LUZ.reais(p.preco) + '</p>' +
      '<div class="cartao-acoes"><button class="botao" type="button" data-add="' + p.nome + '">Adicionar ao carrinho</button>' +
      '<button class="link-ficha" type="button" data-ficha="' + p.id + '">Ver detalhes</button></div></article>';
  }

  function atualizar(reset) {
    if (reset) visiveis = POR_VEZ;
    var termo = semAcento(busca.value.trim());
    filtradas = PRODUTOS.filter(function (p) {
      return (!termo || semAcento(p.nome).indexOf(termo) > -1) &&
        (!familia.value || p.categoria === familia.value) &&
        (!tamanho.value || p.tamanho === tamanho.value);
    });
    var mostradas = filtradas.slice(0, visiveis);
    grade.innerHTML = mostradas.map(card).join("");
    var filtrado = termo || familia.value || tamanho.value;
    contador.textContent = filtrado
      ? filtradas.length + (filtradas.length === 1 ? " vela encontrada" : " velas encontradas") + " de 100 · mostrando " + mostradas.length
      : "Mostrando " + mostradas.length + " de " + PRODUTOS.length + " velas";
    vazio.hidden = filtradas.length > 0;
    mais.hidden = mostradas.length >= filtradas.length;
    limpar.hidden = !filtrado;
  }

  [busca, familia, tamanho].forEach(function (c) {
    c.addEventListener("input", function () { atualizar(true); });
  });
  var formulario = document.getElementById("form-filtros");
  if (formulario) formulario.addEventListener("submit", function (e) { e.preventDefault(); });
  limpar.addEventListener("click", function () {
    busca.value = ""; familia.value = ""; tamanho.value = ""; atualizar(true); busca.focus();
  });
  mais.addEventListener("click", function () {
    var antes = visiveis;
    visiveis += POR_VEZ; atualizar(false);
    var novo = grade.children[antes] && grade.children[antes].querySelector(".link-ficha");
    if (novo) novo.focus();
  });

  // Ficha com carrossel exclusivo do produto
  var ficha = document.getElementById("ficha");
  if (!ficha) { atualizar(true); return; }
  var trilho = ficha.querySelector(".ficha-trilho");
  var pontos = ficha.querySelector(".ficha-pontos");
  var carrossel = ficha.querySelector(".ficha-carrossel");
  var atual = 0, total = 0, origem = null;
  var ANGULOS = ["peça inteira", "outro ângulo", "close do acabamento", "foto ambientada"];
  var legendas = ANGULOS;

  function irPara(i) {
    if (!total) return;
    atual = (i + total) % total;
    trilho.style.transform = "translateX(" + (-100 * atual) + "%)";
    trilho.querySelectorAll("figure").forEach(function (f, j) { f.setAttribute("aria-hidden", j === atual ? "false" : "true"); });
    pontos.querySelectorAll("button").forEach(function (b, j) { b.setAttribute("aria-current", j === atual ? "true" : "false"); });
    ficha.querySelector(".ficha-posicao").textContent = "Foto " + (atual + 1) + " de " + total + ": " + legendas[atual];
  }

  var hashDaFicha = "";
  function abrir(id, gatilho, combo) {
    var p = combo || PRODUTOS.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    origem = gatilho || document.activeElement;
    ficha.querySelector("#ficha-titulo").textContent = p.nome;
    legendas = combo ? combo.legendas : ANGULOS;
    ficha.querySelector(".ficha-meta").textContent = combo ? "Combo de velas prontas · " + p.velas.length + " velas" : p.categoria + " · " + p.tamanho + " · " + p.peso + " g";
    ficha.querySelector(".ficha-notas").textContent = combo ? p.velas.map(function (v) { return v.nome; }).join(" · ") : p.notas;
    ficha.querySelector(".ficha-descricao").textContent = combo ? "Uma unidade de cada vela, na caixa creme com papel de seda cranberry." : p.descricao;
    ficha.querySelector(".ficha-detalhe").textContent = combo ? "Velas prontas para presentear. Não contém materiais de montagem." : "Detalhe: " + p.detalhe + ".";
    ficha.querySelector(".ficha-preco").textContent = LUZ.reais(p.preco);
    ficha.querySelector(".ficha-add").setAttribute("data-add", p.nome);
    var marca = p.formato === "escultural" ? "com etiqueta Luz de Canela" : "com rótulo Luz de Canela";
    var pend = ficha.querySelector(".ficha-pendente");
    if (p.galeria.length) {
      // fotos adicionais só são carregadas agora, ao abrir a ficha
      trilho.innerHTML = p.galeria.map(function (src, j) {
        var alt = p.nome + ", " + legendas[j] + (combo ? "" : (j === 0 ? " " + marca : "") + " – " + p.detalhe);
        return '<figure><img src="' + src + '" width="800" height="800" alt="' + alt + '"></figure>';
      }).join("");
      total = p.galeria.length;
      carrossel.hidden = false;
      pend.hidden = combo || !p.galeriaPendente.length;
      if (!pend.hidden) pend.querySelector("span").textContent = p.galeriaPendente.map(function (g) { return g.split("/").pop(); }).join(", ");
    } else {
      trilho.innerHTML = ""; total = 0;
      carrossel.hidden = true;
      pend.hidden = false;
      pend.querySelector("span").textContent = p.galeriaPendente.map(function (g) { return g.split("/").pop(); }).join(", ");
    }
    pontos.innerHTML = "";
    for (var j = 0; j < total; j++) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Foto " + (j + 1) + ": " + legendas[j]);
      b.addEventListener("click", (function (k) { return function () { irPara(k); }; })(j));
      pontos.appendChild(b);
    }
    atual = 0; irPara(0);
    hashDaFicha = location.hash;
    if (!ficha.open) ficha.showModal();
  }

  ficha.querySelector(".ficha-fechar").addEventListener("click", function () { ficha.close(); });
  ficha.addEventListener("close", function () {
    if (ficha.open) return; // evento atrasado de uma ficha anterior: já foi reaberta
    // só limpa o hash que abriu esta ficha; um hash novo (outra vela) é preservado
    if (location.hash && location.hash === hashDaFicha) {
      try { history.replaceState(null, "", location.pathname); } catch (erro) { /* file:// pode restringir o histórico. */ }
    }
    if (origem && origem.isConnected) origem.focus();
  });
  ficha.addEventListener("click", function (e) { if (e.target === ficha) ficha.close(); });
  ficha.querySelectorAll(".ficha-seta").forEach(function (b) {
    b.addEventListener("click", function () { irPara(atual + Number(b.getAttribute("data-dir"))); });
  });
  ficha.addEventListener("keydown", function (e) {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === "ArrowRight") { irPara(atual + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft") { irPara(atual - 1); e.preventDefault(); }
  });
  var x0 = null;
  carrossel.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  carrossel.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) irPara(atual + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  grade.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ficha]");
    if (b) abrir(Number(b.getAttribute("data-ficha")), b);
  });
  document.querySelectorAll("[data-ficha-slug]").forEach(function (b) {
    b.addEventListener("click", function () { abrirSlug(b.getAttribute("data-ficha-slug"), b); });
  });
  function abrirSlug(s, gatilho) {
    var p = PRODUTOS.filter(function (x) { return x.slug === s || (x.aliases || []).indexOf(s) > -1; })[0];
    if (p) abrir(p.id, gatilho);
  }

  atualizar(true);
  var gradeCombos = document.getElementById("grade-combos");
  if (gradeCombos && typeof COMBOS !== "undefined") {
    gradeCombos.innerHTML = COMBOS.map(function (c) {
      return '<article class="cartao cartao-vela"><button type="button" class="cartao-foto" data-combo="' + c.slug + '" aria-label="Ver fotos de ' + c.nome + '"><img src="' + c.imagem + '" width="600" height="600" loading="lazy" alt="' + c.nome + ': caixa creme aberta com ' + c.velas.map(function (p) { return p.nome; }).join(', ') + ' e papel de seda cranberry"></button><p class="cartao-meta">Combo de velas prontas · ' + c.velas.length + ' velas</p><h3>' + c.nome + '</h3><ul>' + c.velas.map(function (p) { return '<li>' + p.nome + '</li>'; }).join('') + '</ul><p class="preco">' + LUZ.reais(c.preco) + '</p><div class="cartao-acoes"><button type="button" class="botao" data-add="' + c.nome + '">Adicionar ao carrinho</button><button type="button" class="link-ficha" data-combo="' + c.slug + '">Ver fotos do conjunto</button></div></article>';
    }).join("");
    gradeCombos.addEventListener("click", function (e) {
      var b = e.target.closest("[data-combo]");
      if (!b) return;
      var c = COMBOS.find(function (x) { return x.slug === b.dataset.combo; });
      if (c) abrir(null, b, c);
    });
  }
  if (location.hash) abrirSlug(location.hash.slice(1));
  window.addEventListener("hashchange", function () {
    if (location.hash) abrirSlug(location.hash.slice(1));
    else if (ficha.open) { hashDaFicha = ""; ficha.close(); }
  });
})();
