import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

function dados() {
  const scope: Record<string, any> = {};
  for (const file of ['produtos.js', 'combos-dados.js']) {
    runInNewContext(readFileSync(resolve('av2-estatico/js', file), 'utf8'), scope);
  }
  return scope;
}

describe('Lote piloto e combos', () => {
  it('preserva 100 IDs e 20 velas em cada uma das cinco famílias', () => {
    const ps = dados()['PRODUTOS'];
    expect(ps.map((p: any) => p.id)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
    for (const family of ['Doces de Natal', 'Bosque de Inverno', 'Frutas da Ceia', 'Especiarias Quentes', 'Aromas Suaves']) {
      expect(ps.filter((p: any) => p.categoria === family)).toHaveLength(20);
    }
  });
  it('oferece produtos nos quatro tamanhos com preços numéricos positivos', () => {
    const ps = dados()['PRODUTOS'];
    expect([...new Set(ps.map((p: any) => p.tamanho))].sort()).toEqual(['Grande', 'Mini', 'Média', 'Pequena'].sort());
    for (const p of ps) { expect(typeof p.preco).toBe('number'); expect(p.preco).toBeGreaterThan(0); }
  });
  it('dá às 100 velas uma capa e quatro fotos exclusivas existentes', () => {
    const ps = dados()['PRODUTOS'];
    expect(ps.filter((p: any) => p.fotoPrincipalPronta)).toHaveLength(100);
    for (const p of ps) {
      expect(p.galeria).toHaveLength(4);
      expect(p.galeria[0]).toBe(p.imagem);
      for (const path of p.galeria) expect(path).toContain(p.slug);
    }
    const paths = ps.flatMap((p: any) => p.galeria);
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of ps) for (const path of p.galeria) expect(existsSync(resolve('av2-estatico', path))).toBe(true);
  });
  it.each([
    ['Dupla Sob a Árvore', [25, 93]],
    ['Trio Depois da Ceia', [1, 15, 61]],
    ['Caixa Noite de Dezembro', [21, 72, 87]],
  ])('%s contém exatamente as velas previstas', (name, ids) => {
    const combo = dados()['COMBOS'].find((c: any) => c.nome === name);
    expect(combo.velaIds).toEqual(ids);
    expect(combo.velas.map((p: any) => p.id)).toEqual(ids);
    expect(combo.galeria.slice(1, -1)).toEqual(combo.velas.map((p: any) => p.imagem));
    expect(Math.round(combo.preco * 100)).toBe(combo.velas.reduce((s: number, p: any) => s + Math.round(p.preco * 100), 0));
    for (const path of combo.galeria) expect(existsSync(resolve('av2-estatico', path))).toBe(true);
  });
});