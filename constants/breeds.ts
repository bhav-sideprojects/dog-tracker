import { BreedId } from '@/store/types';

// 0=transparent  1=primary body  2=secondary (muzzle/markings)  3=dark (eyes/nose)
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

// All grids: front-facing dog faces, 20 cols × 18 rows
// ─────────────────────────────────────────────────────────────────────────────

// CORGI — large triangular ears pointing up, orange body, cream muzzle
const CORGI_GRID = p([
  '.11...........11....',
  '1111..........1111..',
  '11111........11111..',
  '111111......111111..',
  '1111111....1111111..',
  '11111111111111111111',
  '11111111111111111111',
  '11111131111113111111',  // eyes at cols 6, 13
  '11111111111111111111',
  '11111122222221111111',  // cream muzzle starts
  '11111122322221111111',  // nose at col 8
  '11111122222221111111',
  '11111112222211111111',
  '11111111111111111111',
  '.111111111111111111.',
  '..11111111111111111.',
  '...111111111111111..',
  '....11111111111.....',
]);

// DACHSHUND — very long droopy ears hanging to sides (cols 0-1 and 18-19)
const DACHSHUND_GRID = p([
  '....11111111111.....',
  '...1111111111111....',
  '..111111111111111...',
  '11.11111111111111.11',  // ears appear at cols 0-1 and 18-19
  '11.11111111111111.11',
  '11.11131111113111.11',  // eyes
  '11.11111111111111.11',
  '11.11122222221111.11',  // muzzle
  '11.11122322221111.11',  // nose
  '11.11122222221111.11',
  '11.11111111111111.11',
  '11.11111111111111.11',
  '11..1111111111111.11',
  '11...111111111111.11',
  '11....11111111111.11',
  '11................11',  // ears only
  '11................11',
  '11................11',
]);

// FRENCH BULLDOG — wide bat ears at top corners, stocky face
const FRENCHIE_GRID = p([
  '1111............1111',
  '1111..........111111',
  '111111......11111111',
  '11111111111111111111',
  '11111111111111111111',
  '11111111111111111111',
  '11111131111113111111',  // eyes
  '11111111111111111111',
  '11111122222221111111',  // muzzle
  '11111122322221111111',  // nose
  '11111122222221111111',
  '11111112222211111111',
  '11111111111111111111',
  '.111111111111111111.',
  '..11111111111111111.',
  '..1111111111111111..',
  '...111111111111111..',
  '....11111111111111..',
]);

// HUSKY — pointed upright ears, gray face markings around eyes, lighter muzzle
const HUSKY_GRID = p([
  '....111..111........',
  '...11111.11111......',
  '..111111111111111...',
  '.1111111111111111...',
  '.1111111111111111...',
  '.1111111111111111...',
  '.1111113111131111...',  // eyes at cols 7, 12
  '.1111111111111111...',
  '.1111112222221111...',  // lighter muzzle
  '.1111112232221111...',  // nose
  '.1111112222221111...',
  '.1111111111111111...',
  '..111111111111111...',
  '..111111111111111...',
  '...11111111111111...',
  '...11111111111......',
  '....111111111.......',
  '....111111111.......',
]);

// TOY POODLE — very round fluffy head, large ears hanging (cols 0-1 and 18-19), warm apricot
const POODLE_GRID = p([
  '....11111111111.....',
  '..1111111111111111..',
  '.11111111111111111..',
  '111111111111111111..',
  '11111111111111111111',
  '11111111111111111111',
  '11111131111113111111',  // eyes at cols 6, 13
  '11111111111111111111',
  '11111111111111111111',
  '11111122222221111111',  // muzzle
  '11111222222222111111',
  '11111122322222111111',  // nose
  '11111122222221111111',
  '11.111111111111111..',  // ears separate (cols 0-1 and 18-19)
  '11.111111111111111..',
  '11.111111111111111..',
  '11..111111111111....',
  '11...111111111......',
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
    colors: { primary: '#DDDDDD', secondary: '#F5F5F5', dark: '#111111' },
    grid: HUSKY_GRID,
  },
  poodle: {
    id: 'poodle',
    name: 'Toy Poodle',
    colors: { primary: '#C5702A', secondary: '#F0D4A8', dark: '#111111' },
    grid: POODLE_GRID,
  },
};

export const BREED_ORDER: BreedId[] = ['corgi', 'dachshund', 'frenchie', 'husky', 'poodle'];
