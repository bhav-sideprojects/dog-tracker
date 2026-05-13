import { BreedId } from '@/store/types';

// 0=transparent  1=primary body  2=secondary (muzzle/markings/chest)  3=dark (eyes/nose)
type PixelValue = 0 | 1 | 2 | 3;
export type PixelGrid = PixelValue[][];

export type BreedConfig = {
  id: BreedId;
  name: string;
  colors: { primary: string; secondary: string; dark: string };
  grid: PixelGrid;
};

// Pad every row to exactly GRID_COLS so minor counting errors don't break layout
export const GRID_COLS = 20;
export const GRID_ROWS = 18;

function p(rows: string[]): PixelGrid {
  return rows.map(row => {
    const padded = row.padEnd(GRID_COLS, '.').slice(0, GRID_COLS);
    return padded.split('').map(ch => {
      if (ch === '1') return 1;
      if (ch === '2') return 2;
      if (ch === '3') return 3;
      return 0;
    }) as PixelValue[];
  });
}

// All grids: front-facing sitting full-body pose, 20 cols × 18 rows
// Layer order when rendered: primary fill (animated) → secondary always → dark always
// ─────────────────────────────────────────────────────────────────────────────

// TOY POODLE — round pompom ears, fluffy round body, apricot brown
// Based on reference: sitting pose, prominent round ears, curly tail bottom-right
const POODLE_GRID = p([
  '......1111111.......',  // head top
  '..11.11111111.11....',  // pompom ear tops + head
  '.111.11111111.111...',  // ears + head
  '.111.11131311.111...',  // ears + eyes (3 at cols 8, 10)
  '.111.11122211.111...',  // ears + muzzle
  '.111.11132211.111...',  // ears + nose (3 at col 8)
  '.11..11111111..11...',  // ear bottom + chin
  '.....11111111.......',  // neck
  '....1111111111......',  // body top
  '...111122221111.....',  // body + cream chest
  '...111111111111.....',  // body
  '...111111111111.....',  // body
  '...11111111111111...',  // body wide
  '....1111111111.11...',  // lower body + tail (cols 15-16)
  '....1111111111.11...',  // body + tail
  '....1111..11111.....',  // legs
  '.....111...1111.....',  // paws
  '.....11.....11......',  // feet
]);

// CORGI — large triangular ears pointing straight up, wide orange face, cream chest
const CORGI_GRID = p([
  '...111.......111....',  // ear tips
  '..1111.......1111...',  // ears
  '.11111.......11111..',  // ears
  '.111111111111111111.',  // ears connect to head
  '11111111111111111111',  // full-width head
  '11111113111131111111',  // eyes (3 at cols 7, 12)
  '11111122222211111111',  // muzzle (2 at cols 7-12)
  '11111122322211111111',  // nose (3 at col 9)
  '.111111111111111111.',  // chin/jowls
  '..11111111111111111.',  // neck
  '..111112222211111...',  // body + cream chest
  '..111112222211111...',  // chest
  '...11111111111111...',  // body
  '...1111111111111....',  // lower body
  '....111111111111....',  // body bottom
  '....11111.11111.....',  // legs
  '.....1111..1111.....',  // paws
  '.....111....111.....',  // feet
]);

// DACHSHUND — very long droopy ears hanging from sides of head
const DACHSHUND_GRID = p([
  '......11111111......',  // head top
  '.....1111111111.....',  // head
  '.11..1111111111..11.',  // ear start + head
  '.11..1131311111..11.',  // ears + eyes (3 at cols 7, 9)
  '.11..1122221111..11.',  // ears + muzzle
  '.11..1132221111..11.',  // ears + nose
  '.11..1111111111..11.',  // ears + chin
  '.11..1111111111..11.',  // ears hanging
  '.11.1111111111111.11',  // ears + body
  '.11.1111111111111.11',  // ears + body
  '.11.1111111111111.11',  // ears + body
  '.11..111111111111.11',  // ears + body
  '.11...11111111111.11',  // ears + body
  '.....11111111111....',  // body
  '.....11111111111....',  // lower body
  '.....11111.11111....',  // legs
  '......1111..1111....',  // paws
  '......111....111....',  // feet
]);

// FRENCH BULLDOG — wide bat ears at top corners, stocky face, fawn
const FRENCHIE_GRID = p([
  '111111........111111',  // bat ears at corners
  '1111111......1111111',  // ears narrowing toward head
  '11111111....11111111',  // ears + head top
  '11111111111111111111',  // full head
  '11111111111111111111',  // head
  '11111131111131111111',  // eyes (3 at cols 7, 12)
  '11111122222211111111',  // muzzle/jowls
  '11111122322211111111',  // nose (3 at col 9)
  '.111111111111111111.',  // chin/jowls
  '..11111111111111111.',  // neck
  '..111112222211111...',  // body + cream chest
  '..111112222211111...',  // chest
  '...11111111111111...',  // body
  '....1111111111111...',  // lower body
  '.....111111111111...',  // body bottom
  '.....11111.11111....',  // legs
  '......1111..1111....',  // paws
  '......111....111....',  // feet
]);

// HUSKY — pointed ears, distinctive eye mask (secondary=light), wolf-like
const HUSKY_GRID = p([
  '....111.....111.....',  // ear tips
  '...11111...11111....',  // ears
  '..111111...111111...',  // ears + head sides
  '..11111111111111....',  // head
  '..111122222211111...',  // eye mask (2 = light/white)
  '..111123122311111...',  // eyes (3 at cols 7, 11) within mask
  '..111122222211111...',  // mask lower
  '..111112222211111...',  // muzzle (lighter)
  '..111112322211111...',  // nose (3 at col 8)
  '..11111111111111....',  // chin/neck
  '...1111111111111....',  // body
  '...1111111111111....',  // body
  '....111111111111....',  // body
  '....111111111111....',  // lower body
  '....11111111111.....',  // body bottom
  '....11111.11111.....',  // legs
  '.....1111..1111.....',  // paws
  '.....111....111.....',  // feet
]);

export const BREEDS: Record<BreedId, BreedConfig> = {
  corgi: {
    id: 'corgi',
    name: 'Corgi',
    colors: { primary: '#E8952C', secondary: '#FFF0D4', dark: '#111111' },
    grid: CORGI_GRID,
  },
  dachshund: {
    id: 'dachshund',
    name: 'Dachshund',
    colors: { primary: '#8B4513', secondary: '#D2A679', dark: '#111111' },
    grid: DACHSHUND_GRID,
  },
  frenchie: {
    id: 'frenchie',
    name: 'French Bulldog',
    colors: { primary: '#C8A882', secondary: '#F5EDE0', dark: '#111111' },
    grid: FRENCHIE_GRID,
  },
  husky: {
    id: 'husky',
    name: 'Husky',
    colors: { primary: '#888888', secondary: '#EEEEEE', dark: '#111111' },
    grid: HUSKY_GRID,
  },
  poodle: {
    id: 'poodle',
    name: 'Toy Poodle',
    colors: { primary: '#A07044', secondary: '#D4AA78', dark: '#3D1F00' },
    grid: POODLE_GRID,
  },
};

export const BREED_ORDER: BreedId[] = ['corgi', 'dachshund', 'frenchie', 'husky', 'poodle'];
