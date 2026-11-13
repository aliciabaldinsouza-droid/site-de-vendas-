// Galerias independentes: conjunto, cada material e resultado da montagem.
(function () {
  var lista = document.getElementById('lista-kits');
  if (!lista || typeof KITS === 'undefined') return;
  lista.innerHTML = KITS.map(function (k, i) {
    return '<article class="kit" id="' + k.slug + '" aria-labelledby="titulo-' + k.slug + '"><div class="kit-grade">' +
      '<div class="kit-galeria" tabindex="0" aria-roledescription="carrossel" aria-label="Fotos do kit ' + k.nome + '">' +
      '<figure class="kit-foto"><img src="' + k.imagem + '" width="960" height="960" ' + (i ? 'loading="lazy"' : 'fetchpriority="high"') + ' alt="Kit ' + k.nome + ': caixa creme aberta vista de cima e os 14 materiais inclusos"><figcaption></figcaption></figure>' +
      '<div class="kit-controles"><button class="kit-seta" type="button" data-dir="-1" aria-label="Foto anterior de ' + k.nome + '" title="Foto anterior"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
      '<div class="kit-pontos"></div><button class="kit-seta" type="button" data-dir="1" aria-label="Próxima foto de ' + k.nome + '" title="Próxima foto"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button></div><p class="kit-posicao" aria-live="polite"></p></div>' +
      '<div><p class="sobretitulo">Kit de montagem · 0' + (i + 1) + '</p><h2 id="titulo-' + k.slug + '">' + k.nome + '</h2><p class="notas">' + k.notas + '</p><p>' + k.descricao + '</p>' +
      '<p class="kit-preco">' + LUZ.reais(k.preco) + '</p><button class="botao" type="button" data-add="Kit ' + k.nome + '">Adicionar ao carrinho</button>' +
      '<h3>O que vem na caixa</h3><ul class="kit-materiais">' + k.materiais.map(function (m) { return '<li>' + m.nome + '</li>'; }).join('') + '</ul>' +
      '<p class="kit-embalagem">14 materiais + caixa creme com a marca. Linho e pedra do cenário não inclusos; papel de proteção faz parte da embalagem.</p>' +
      '<details><summary>Montagem de ' + k.nome + '</summary><ol class="kit-passos">' +
      '<li>Leia o cartão e as orientações dos fabricantes da cera e da essência. Prepare uma superfície protegida, uma panela para banho-maria e uma fonte de calor; esses utensílios domésticos não acompanham o kit.</li>' +
      '<li>Fixe o pavio no centro do recipiente com o adesivo e mantenha-o vertical usando o centralizador.</li>' +
      '<li>Derreta a cera vegetal na jarra em banho-maria, sem chama direta. Use o termômetro e siga as temperaturas e a proporção de essência indicadas pelos fabricantes; misture com a espátula e verta no recipiente.</li>' +
      k.passos.map(function (s) { return '<li>' + s + '</li>'; }).join('') +
      '<li>Deixe esfriar e respeite o tempo de cura indicado para a cera. Retire o centralizador, apare o pavio e aplique o rótulo no recipiente limpo e frio.</li></ol>' +
      '<p class="kit-seguranca">Montagem por um adulto. Cera quente pode causar queimaduras. Enfeites são de cera, não comestíveis: retire-os antes de acender e nunca deixe a vela acesa sem supervisão.</p></details></div></div></article>';
  }).join('');

  KITS.forEach(function (k) {
    var article = document.getElementById(k.slug);
    var galeria = article.querySelector('.kit-galeria');
    var img = galeria.querySelector('img');
    var legenda = galeria.querySelector('figcaption');
    var posicao = galeria.querySelector('.kit-posicao');
    var pontos = galeria.querySelector('.kit-pontos');
    var fotos = [{ imagem: k.imagem, legenda: 'Caixa aberta · todos os materiais inclusos', alt: 'Kit ' + k.nome + ': vista de cima da caixa creme aberta com os 14 materiais inclusos' }].concat(k.materiais.map(function (m) {
      return { imagem: m.imagem, legenda: m.nome + ' · incluso', alt: 'Kit ' + k.nome + ': foto individual de ' + m.nome.toLowerCase() };
    }), [{ imagem: k.resultado, legenda: 'Resultado da montagem', alt: k.nome + ': resultado da montagem. ' + k.descricao }]);
    var atual = 0;
    function irPara(n) {
      atual = (n + fotos.length) % fotos.length;
      var foto = fotos[atual];
      var quadro = galeria.querySelector('.kit-foto');
      if (quadro) {
        quadro.classList.remove('foto-trocando');
        void quadro.offsetWidth; // Reinicia a transição CSS a cada troca.
        quadro.classList.add('foto-trocando');
      }
      img.src = foto.imagem;
      img.alt = foto.alt;
      legenda.textContent = foto.legenda;
      posicao.textContent = 'Foto ' + (atual + 1) + ' de ' + fotos.length;
      pontos.querySelectorAll('button').forEach(function (b, j) { b.setAttribute('aria-current', j === atual ? 'true' : 'false'); });
    }
    fotos.forEach(function (f, n) {
      var b = document.createElement('button');
      b.className = 'kit-ponto'; b.type = 'button';
      b.setAttribute('aria-label', k.nome + ': ' + f.legenda);
      b.title = f.legenda;
      b.addEventListener('click', function () { irPara(n); });
      pontos.appendChild(b);
    });
    galeria.querySelectorAll('[data-dir]').forEach(function (b) { b.addEventListener('click', function () { irPara(atual + Number(b.dataset.dir)); }); });
    galeria.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); irPara(atual + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); irPara(atual - 1); }
      if (e.key === 'Home') { e.preventDefault(); irPara(0); }
      if (e.key === 'End') { e.preventDefault(); irPara(fotos.length - 1); }
    });
    var inicio = null;
    img.addEventListener('touchstart', function (e) { inicio = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
    img.addEventListener('touchend', function (e) {
      if (!inicio || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].clientX - inicio.x;
      var dy = e.changedTouches[0].clientY - inicio.y;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) irPara(atual + (dx < 0 ? 1 : -1));
      inicio = null;
    }, { passive: true });
    img.addEventListener('touchcancel', function () { inicio = null; });
    irPara(0);
  });
  function seguirLink() {
    var kit = KITS.find(function (k) { return '#' + k.slug === location.hash; });
    if (kit) document.getElementById(kit.slug).scrollIntoView({ block: 'start' });
  }
  requestAnimationFrame(seguirLink);
  window.addEventListener('hashchange', seguirLink);
})();