import { Api } from 'chessground/api';

import * as atomic from './atomic'

export interface Unit {
  name: string;
  run: (el: HTMLElement) => Api
}

export const list: Unit[] = [
  atomic.initial
];
