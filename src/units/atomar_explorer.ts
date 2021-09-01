import { Unit } from './unit';
import { getChessground } from './atomic';

export const atomarExplorer: Unit = {
  name: 'Atomar chess explorer',
  run(el) {
    return getChessground(el, 'atomar');
  }
};