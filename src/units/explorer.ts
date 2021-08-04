import { Chessground }  from 'chessground';
import { Unit } from './unit';
import { playOtherSide, move } from './atomic';

export const explorer: Unit = {
  name: 'Atomic chess explorer',
  run(el) {
    const cG = Chessground(el, {
      movable: {
        color: 'white',
        free: false,
      },
      draggable: {
        showGhost: true
      }
    });

	move(cG);

    cG.set({
      movable: { events: { after: playOtherSide(cG) } }
    });

    return cG;
  }
};