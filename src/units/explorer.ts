import { Unit } from './unit';
import { getChessground } from './atomic';

export const explorer: Unit = {
  name: 'Atomic chess explorer',
  run(el) {
    return getChessground(el);
  }
};