import { Api } from 'chessground/api';
import { Color, Key } from 'chessground/types';

export function toDests(chess: any): Map<Key, Key[]> {
  const dests = new Map();
  chess.SQUARES.forEach(s => {
    const ms = chess.moves({square: s, verbose: true});
    if (ms.length) dests.set(s, ms.map(m => m.to));
  });
  
  console.log(dests)
  return dests;
}

export function toColor(colorLetter: any): Color {
  return (colorLetter === 'w') ? 'white' : 'black';

}

export function playOtherSide(cg: Api, chess) {
  return (orig, dest) => {
    chess.move({from: orig, to: dest});
    cg.set({
      turnColor: toColor(chess),
      movable: {
        color: toColor(chess),
        dests: toDests(chess)
      }
    });
  };
}

export function mapToObj(map){
  const obj = {}
  for (let [k,v] of map)
    obj[k] = v
  return obj
}

export function aiPlay(cg: Api, chess, delay: number, firstMove: boolean) {
  return (orig, dest) => {
    chess.move({from: orig, to: dest});
    setTimeout(() => {
      const moves = chess.moves({verbose:true});
      const move = firstMove ? moves[0] : moves[Math.floor(Math.random() * moves.length)];
      chess.move(move.san);
      cg.move(move.from, move.to);
      cg.set({
        turnColor: toColor(chess),
        movable: {
          color: toColor(chess),
          dests: toDests(chess)
        }
      });
      cg.playPremove();
    }, delay);
  };
}
