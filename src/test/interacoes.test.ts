import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

function iniciar() {
  const dados = new Map<string, string>();
  const scope: Record<string, any> = {
    document: { querySelector: () => null, getElementById: () => null, querySelectorAll: () => [] },
    window: { matchMedia: () => ({ matches: false }) },
    localStorage: { getItem: (key: string) => dados.get(key) ?? null },
  };
  for (const arquivo of ['produtos.js', 'kits-dados.js', 'script.js']) {
    runInNewContext(readFileSync(resolve('av2-estatico/js', arquivo), 'utf8'), scope);
  }
  return scope;
}

describe('Regras da entrega estática', () => {
  it('cadastra exatamente 100 velas únicas, com 20 em cada família', () => {
    const scope = iniciar();
    expect(scope['PRODUTOS']).toHaveLength(100);
    expect(new Set(scope['PRODUTOS'].map((p: any) => p.id)).size).toBe(100);
    for (const familia of ['Doces de Natal', 'Bosque de Inverno', 'Frutas da Ceia', 'Especiarias Quentes', 'Aromas Suaves']) {
      expect(scope['PRODUTOS'].filter((p: any) => p.categoria === familia)).toHaveLength(20);
    }
  });
  it('exige os quatro campos de contato', () => {
    const scope = iniciar();
    expect(Object.keys(scope['LUZ'].validarContato({}))).toEqual(['nome', 'email', 'assunto', 'mensagem']);
  });
  it('rejeita formato de e-mail inválido e aceita dados válidos', () => {
    const validar = iniciar()['LUZ'].validarContato;
    const dados = { nome: 'Alicia', email: 'alicia@exemplo.com', assunto: 'Natal', mensagem: 'Gostei dos kits.' };
    expect(Object.keys(validar(dados))).toHaveLength(0);
    expect(validar({ ...dados, email: 'alicia@' }).email).toBeTruthy();
  });
  it('rejeita valores acima dos limites declarados e campos em branco', () => {
    const validar = iniciar()['LUZ'].validarContato;
    expect(Object.keys(validar({ nome: 'a'.repeat(101), email: 'a'.repeat(256), assunto: 'a'.repeat(121), mensagem: 'a'.repeat(1001) }))).toHaveLength(4);
    expect(Object.keys(validar({ nome: ' ', email: ' ', assunto: ' ', mensagem: ' ' }))).toHaveLength(4);
  });
  it('adiciona velas e kits, ajusta quantidades, remove e conclui sem cobrança', () => {
    document.body.innerHTML = '<header class="cabecalho"><div class="container"></div></header>';
    const armazenamento = new Map<string, string>();
    const scope: Record<string, any> = {
      document,
      window: { matchMedia: () => ({ matches: false }) },
      localStorage: {
        getItem: (key: string) => armazenamento.get(key) ?? null,
        setItem: (key: string, value: string) => armazenamento.set(key, value),
      },
    };
    for (const arquivo of ['produtos.js', 'kits-dados.js', 'combos-dados.js', 'script.js']) {
      runInNewContext(readFileSync(resolve('av2-estatico/js', arquivo), 'utf8'), scope);
    }
    const adicionar = scope['LUZ'].adicionar;
    const ler = () => JSON.parse(armazenamento.get('carrinho') ?? '[]');
    const clicar = (rotulo: string) => {
      const botao = document.querySelector<HTMLButtonElement>(`[aria-label="${rotulo}"]`);
      if (!botao) throw new Error(`Controle ausente: ${rotulo}`);
      botao.click();
    };
    adicionar('Bosque da Véspera'); adicionar('Kit Bosque da Véspera');
    expect(ler()).toHaveLength(2);
    clicar('Aumentar Bosque da Véspera');
    expect(ler()[0].quantidade).toBe(2);
    expect(ler().reduce((s: number, p: any) => s + Math.round(p.preco * 100) * p.quantidade, 0)).toBe(34970);
    clicar('Diminuir Bosque da Véspera');
    expect(ler()[0].quantidade).toBe(1);
    clicar('Remover Kit Bosque da Véspera'); expect(ler()).toHaveLength(1);
    const concluir = document.querySelector<HTMLButtonElement>('.concluir-compra');
    if (!concluir) throw new Error('Conclusão ausente');
    concluir.click(); expect(ler()).toEqual([]);
    adicionar('Dupla Sob a Árvore');
    expect(ler()[0].conteudo.map((p: any) => p.id)).toEqual([25, 93]);
    expect(ler()[0].conteudo.map((p: any) => p.quantidade)).toEqual([1, 1]);
    expect(Math.round(ler()[0].preco * 100)).toBe(14480);
    concluir.click(); expect(ler()).toEqual([]);
    document.body.replaceChildren();
  });
});