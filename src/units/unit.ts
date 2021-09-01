import { Api } from 'chessground/api';

import { atomicExplorer } from './atomic_explorer'
import { atomarExplorer } from './atomar_explorer'

export interface Unit {
  name: string;
  run: (el: HTMLElement) => Api;
  setFen: (cG: any, fen: string) => void;
}

export const list: Unit[] = [
  atomicExplorer,
  atomarExplorer
];
