import { Chessground }  from 'chessground';
import * as util from 'chessground/util';
import * as cg from 'chessground/types';
import { Unit } from './unit';
import { mapToObj } from '../util'

async function getDests(fen: any) : Promise<Map<any, any[]>> {
	var enc_fen = encodeURIComponent(fen);
	var resp = await fetch(window.location.origin + "/moves?fen=" + enc_fen, {
	  // mode: 'no-cors',
	  method: 'GET',
	  headers: {
		Accept: 'application/json',
	  },
	});
	
	var moves = await resp.text();
	return new Map(JSON.parse(moves));
}

export function capture(cG: any, key: cg.Key) {
  const exploding: cg.Key[] = [],
    diff: cg.PiecesDiff = new Map(),
    orig = util.key2pos(key),
    minX = Math.max(0, orig[0] - 1),
    maxX = Math.min(7, orig[0] + 1),
    minY = Math.max(0, orig[1] - 1),
    maxY = Math.min(7, orig[1] + 1);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const k = util.pos2key([x, y]);
      exploding.push(k);
      const p = cG.state.pieces.get(k);
      const explodes = p && (k === key || p.role !== 'pawn');
      if (explodes) diff.set(k, undefined);
    }
  }
  cG.setPieces(diff);
  cG.explode(exploding);
}

var turnColor1 = 0;
var pieces;

export function playOtherSide1(cG: any) {
  //console.log(cG.getFen());

  return (orig, dest) => {
	console.log("Moved from " + orig + " to " + dest);
	console.log(pieces[dest]);
	
	if (pieces[dest] != undefined) {
		console.log("Destination square is occupied, calling a nuke on that square!");
		capture(cG, dest);
	}

	console.log("New fen is: ");
	var fen = JSON.stringify(cG.getFen()).slice(1, -1) + " " + ((turnColor1 % 2 == 0) ? "b" : "w");
	
	var turnColor = (turnColor1 % 2 == 0) ? "black" : "white";
	turnColor1++;
	
	console.log(fen);
	getDests(fen).then(result => {
		console.log("Available moves: ");
		console.log(result);
		
		pieces = mapToObj(cG.state.pieces);
		console.log("Pieces on the board:");
		console.log(pieces);
	
		cG.set({
		  turnColor: turnColor,
		  movable: {
			color: turnColor,
			dests: result
		  }
		});
	});
  };
}

export const initial: Unit = {
  name: 'Atomic chess',
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
	
	//cG.set({fen: "rnbqkbnr/pppp1ppp/4p3/4N3/8/8/PPPPPPPP/RNBQKB1R w KQkq - 0 1"});
	//chess = new Chess("8/p7/8/1K1k4/8/8/6P1/8 w - - 0 1");

	getDests(cG.getFen()).then(result => {
		console.log(result);
		
		pieces = mapToObj(cG.state.pieces);
		console.log("Pieces on the board:");
		console.log(pieces);
  
		cG.set({
		  movable: { dests: result }
		});
		// got final result
	});

    cG.set({
      movable: { events: { after: playOtherSide1(cG) } }
    });

    return cG;
  }
};