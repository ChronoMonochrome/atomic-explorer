import { Api } from 'chessground/api';

import { explorer } from './explorer'

export interface Unit {
  name: string;
  run: (el: HTMLElement) => Api
}

export const list: Unit[] = [
  explorer
];
