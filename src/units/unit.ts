import { Api } from 'chessground/api';

import * as basics from './basics'
import * as play from './play'
import * as perf from './perf'
import * as anim from './anim'
import * as svg from './svg'

export interface Unit {
  name: string;
  run: (el: HTMLElement) => Api
}

export const list: Unit[] = [
  basics.defaults, basics.fromFen,
  play.initial, play.castling, play.vsRandom, play.slowAnim, play.conflictingHold,
  perf.move, perf.select,
  anim.conflictingAnim,
  svg.presetUserShapes, svg.changingShapesHigh, svg.changingShapesLow
];
