// Conteúdo e preços derivados das velas individuais; carregar depois de produtos.js.
var COMBOS = [
  {
    "slug": "dupla-sob-a-arvore",
    "nome": "Dupla Sob a Árvore",
    "velaIds": [
      25,
      93
    ]
  },
  {
    "slug": "trio-depois-da-ceia",
    "nome": "Trio Depois da Ceia",
    "velaIds": [
      1,
      15,
      61
    ]
  },
  {
    "slug": "caixa-noite-de-dezembro",
    "nome": "Caixa Noite de Dezembro",
    "velaIds": [
      21,
      72,
      87
    ]
  }
].map(function (combo) {
  combo.velas = combo.velaIds.map(function (id) { return PRODUTOS.find(function (p) { return p.id === id; }); });
  combo.preco = combo.velas.reduce(function (s, p) { return s + Math.round(p.preco * 100); }, 0) / 100;
  combo.imagem = "img/combos/combo-" + combo.slug + "-conjunto.jpg";
  combo.galeria = [combo.imagem].concat(combo.velas.map(function (p) { return p.imagem; }), ["img/combos/combo-" + combo.slug + "-ambiente.jpg"]);
  combo.legendas = ["Caixa aberta com todas as " + combo.velas.length + " velas"].concat(combo.velas.map(function (p) { return p.nome; }), ["Composição ambientada do conjunto"]);
  return combo;
});
