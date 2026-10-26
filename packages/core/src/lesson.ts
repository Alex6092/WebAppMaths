import { figurePoint } from './geometry';
import type { Figure } from './question';

/**
 * Une fiche de leçon, comme celles du cahier : du texte et des illustrations.
 *
 * Dans les textes : **gras**, *italique* (les exemples) et __souligné__ (le verbe du cahier).
 * Une chaîne seule est un paragraphe.
 */
export type LessonBlock =
  | string
  | { kind: 'list'; items: string[]; ordered?: boolean }
  /** Exemples écrits en grand, dans un cadre. */
  | { kind: 'example'; lines: string[] }
  /** Tableau en colonnes, chacune avec son titre et sa couleur (passé, présent, futur…). */
  | { kind: 'table'; columns: LessonColumn[] }
  /** Frise du temps : AVANT, MAINTENANT, APRÈS. */
  | { kind: 'timeline'; steps: { title: string; text: string; color: string }[] }
  /** Figure de géométrie, avec une règle posée si besoin (le 0 en x, y). */
  | {
      kind: 'figure';
      figure: Figure;
      caption?: string;
      ruler?: { x: number; y: number; angle?: number };
    }
  /** Matériel de numération : plaques de 100, barres de 10, cubes de 1. */
  | { kind: 'base-ten'; value: number }
  /** Droite graduée de from à to ; les points sont mis en couleur. */
  | {
      kind: 'number-line';
      from: number;
      to: number;
      step: number;
      labels: number[];
      points: number[];
    }
  /** Opération posée et calculée, avec ses retenues. */
  | { kind: 'operation'; op: '+' | '-'; operands: number[] }
  /** Quadrillage de rows × cols ronds, pour voir une multiplication. */
  | { kind: 'array'; rows: number; cols: number; caption?: string };

export interface LessonColumn {
  title: string;
  /** Couleur de fond, comme sur la fiche de l'école. */
  color?: string;
  cells: string[];
}

export interface InlinePart {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

/** Découpe un texte de leçon selon **gras**, *italique* et __souligné__. */
export function inlineParts(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const style = { bold: false, italic: false, underline: false };
  for (const token of text.split(/(\*\*|__|\*)/)) {
    if (token === '**') style.bold = !style.bold;
    else if (token === '__') style.underline = !style.underline;
    else if (token === '*') style.italic = !style.italic;
    else if (token) parts.push({ text: token, ...style });
  }
  return parts;
}

/** Le texte sans ses marques de mise en forme. */
export function plainText(text: string): string {
  return inlineParts(text)
    .map((p) => p.text)
    .join('');
}

/** Les signes dits avec des mots, pour la lecture à voix haute. */
function spoken(text: string): string {
  // Seulement entre deux nombres : « le signe < se lit… » garde son signe.
  return plainText(text)
    .replaceAll(/(?<=\d) < (?=\d)/g, ' est plus petit que ')
    .replaceAll(/(?<=\d) > (?=\d)/g, ' est plus grand que ')
    .replaceAll(/(?<=\d) × (?=\d)/g, ' fois ')
    .replaceAll(/(?<=\d) − (?=\d)/g, ' moins ')
    .replaceAll('→', ',');
}

const PLACES = ['unité', 'dizaine', 'centaine'];

/** Ce que dit le bouton 🔊 de la leçon. */
export function lessonSpeech(blocks: readonly LessonBlock[]): string {
  const sentences = blocks.flatMap((block): string[] => {
    if (typeof block === 'string') return [block];
    switch (block.kind) {
      case 'list':
        return block.items;
      case 'example':
        return block.lines;
      case 'table':
        return block.columns.map((c) => `${c.title} : ${c.cells.join(', ')}`);
      case 'timeline':
        return block.steps.map((s) => `${s.title} : ${s.text}`);
      case 'figure':
      case 'array':
        return block.caption ? [block.caption] : [];
      case 'base-ten':
        return [
          [...String(block.value)]
            .reverse()
            .map((d, i) => `${d} ${PLACES[i]}${Number(d) > 1 ? 's' : ''}`)
            .reverse()
            .filter((group) => !group.startsWith('0'))
            .join(', '),
        ];
      default:
        return [];
    }
  });
  return sentences
    .map(spoken)
    .join('. ')
    .replaceAll(/([.:!?])\./g, '$1');
}

/** Erreurs d'une leçon (point inconnu, figure trop petite…), pour le test du catalogue. */
export function lessonErrors(blocks: readonly LessonBlock[]): string[] {
  const errors: string[] = [];
  for (const block of blocks) {
    if (typeof block === 'string') {
      for (const mark of ['**', '__']) {
        if (block.split(mark).length % 2 === 0) errors.push(`« ${mark} » non refermé : ${block}`);
      }
      continue;
    }
    if (block.kind === 'figure') {
      const { figure } = block;
      for (const p of figure.points) {
        if (p.x < 0 || p.y < 0 || p.x > figure.width || p.y > figure.height)
          errors.push(`point ${p.id} hors de la figure`);
      }
      for (const s of figure.segments ?? []) {
        if (!figurePoint(figure, s.from, []) || !figurePoint(figure, s.to, []))
          errors.push(`segment ${s.from}${s.to} : point inconnu`);
      }
    }
    if (block.kind === 'number-line') {
      const outside = [...block.labels, ...block.points].filter(
        (n) => n < block.from || n > block.to,
      );
      if (block.from >= block.to || block.step <= 0 || outside.length)
        errors.push(`droite graduée ${block.from}…${block.to} incorrecte`);
    }
    if (block.kind === 'base-ten' && (block.value < 1 || block.value > 999))
      errors.push(`matériel de numération : ${block.value} n’est pas entre 1 et 999`);
  }
  return errors;
}
