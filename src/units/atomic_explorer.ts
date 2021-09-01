import { Unit } from './unit';
import { getChessground, setFen } from './atomic';

export const atomicExplorer: Unit = {
  name: 'Atomic chess explorer',
  run(el) {
    return getChessground(el, 'atomic');
  },
  setFen: setFen
};