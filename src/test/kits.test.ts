import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

type Kit = { slug: string; nome: string; notas: string; imagem: string; resultado: string; materiais: { id: string; nome: string; imagem: string }[] };
const scope: { KITS?: Kit[] } = {};
runInNewContext(readFileSync(resolve('av2-estatico/js/kits-dados.js'), 'utf8'), scope);
const kits = scope.KITS ?? [];
describe('Initial assembly kits', () => {
  it('contains exactly the four requested models', () => {
    expect(kits.map(k => k.nome)).toEqual(['Bosque da Véspera', 'Biscoito da Meia-Noite', 'Estrela Dourada', 'Natal de Pelúcia']);
  });
  it('preserves the Home link to Bosque da Véspera', () => {
    expect(kits[0]?.slug).toBe('kit-bosque-da-vespera');
  });
  const models = [
    ['Bosque da Véspera', 'Pinheiro, cedro e baunilha', 'Molde duplo de pinheiro', 'Molde de casinha nevada'],
    ['Biscoito da Meia-Noite', 'Gengibre, baunilha e açúcar mascavo', 'Molde de bonequinho de gengibre', 'Saco de confeitar com bico estrela'],
    ['Estrela Dourada', 'Laranja, âmbar e baunilha', 'Molde de estrela', 'Pigmento dourado próprio para velas'],
    ['Natal de Pelúcia', 'Flor de algodão e baunilha', 'Molde de ursinho', 'Bandeja de silicone para apoiar o molde'],
  ];
  models.forEach(([name, notes, mold, accessory]) => {
    it(`has the requested aroma and model-specific materials for ${name}`, () => {
      const kit = kits.find(k => k.nome === name);
      expect(kit?.notas).toBe(notes);
      expect(kit?.materiais.map(m => m.nome)).toEqual(expect.arrayContaining([mold, accessory]));
    });
  });
  it('has one distinct existing individual photo for every included material, plus overview and result', () => {
    expect(kits).toHaveLength(4);
    for (const k of kits) {
      expect(k.materiais).toHaveLength(14);
      const paths = [k.imagem, ...k.materiais.map(m => m.imagem), k.resultado];
      expect(new Set(paths).size).toBe(16);
      for (const path of paths) expect(existsSync(resolve('av2-estatico', path))).toBe(true);
    }
  });
});