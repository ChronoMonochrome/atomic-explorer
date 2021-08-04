import { Chess } from 'chess.js';
import { Chessground }  from 'chessground';
import * as util from 'chessground/util';
import * as cg from 'chessground/types';
import { Unit } from './unit';
import { toColor, toDests, aiPlay, playOtherSide } from '../util'

declare global {
    //interface Window { chess: any; }
    interface Window { Chess: any; }
    interface Window { capture: any; }
	interface Window { playOtherSide: any; }
	interface Window { toDests: any; }
	interface Window { chessground: any; }
}
//getDests(cg.getFen())

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

export function playOtherSide1(cG: any/*, turnColor: any*/) {
  return (orig, dest) => {
    //chess.move({from: orig, to: dest});
	console.log("Moved from " + orig + " to " + dest);

	console.log("New fen is: ");
	//var fen = JSON.stringify(cg.getFen()).slice(1, -1) + " " + ((turnColor == "white") ? "w" : "b");
	var fen = JSON.stringify(cG.getFen()).slice(1, -1) + " " + ((turnColor1 % 2 == 0) ? "b" : "w");
	
	var turnColor = (turnColor1 % 2 == 0) ? "black" : "white";
	turnColor1++;
	
	console.log(fen);
	getDests(fen).then(result => {
		console.log("Available moves: ");
		console.log(result);
	
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
  name: 'Play legal moves from initial position',
  run(el) {
    //var chess = new Chess();
	
	//const cg = Chessground(el);
	
    const cG = Chessground(el, {
      movable: {
        color: 'white',
        free: false,
      },
      draggable: {
        showGhost: true
      }
    });
	
	cG.set({fen: "rnbqkbnr/pppp1ppp/4p3/4N3/8/8/PPPPPPPP/RNBQKB1R w KQkq - 0 1"});
	//chess = new Chess("8/p7/8/1K1k4/8/8/6P1/8 w - - 0 1");

	getDests(cG.getFen()).then(result => {
		console.log(result);
		
		cG.set({
		  movable: { dests: result }
		});
		// got final result
	});

    cG.set({
      movable: { events: { after: playOtherSide1(cG/*, cG.state.turnColor == "white" ? "black" : "white"*/) } }
    });
	
    window.Chess = Chess;
   // window.chess = chess;
	window.toDests = toDests;
	window.playOtherSide = playOtherSide1;
    window.chessground = cG;
    window.capture = capture;

    return cG;
  }
};

export const castling: Unit = {
  name: 'Castling',
  run(el) {
    const fen = 'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
    const chess = new Chess(fen);
    const cG = Chessground(el, {
      fen: fen,
      turnColor: toColor(chess),
      movable: {
        color: 'white',
        free: false,
        dests: toDests(chess)
      }
    });
    cG.set({
      movable: { events: { after: playOtherSide(cG, chess) } }
    });
    return cG;
  }
};

export const vsRandom: Unit = {
  name: 'Play vs random AI',
  run(el) {
    const chess = new Chess();
    const cG = Chessground(el, {
      movable: {
        color: 'white',
        free: false,
        dests: toDests(chess)
      }
    });
    cG.set({
      movable: {
        events: {
          after: aiPlay(cG, chess, 1000, false)
        }
      }
    });
    return cG;
  }
};

export const fullRandom: Unit = {
  name: 'Watch 2 random AIs',
  run(el) {
    const chess = new Chess();
    const cG = Chessground(el, {
      animation: {
        duration: 1000
      },
      movable: {
        free: false
      }
    });
    function makeMove() {
      if (!cG.state.dom.elements.board.offsetParent) return;
      const moves = chess.moves({verbose:true});
      const move = moves[Math.floor(Math.random() * moves.length)];
      chess.move(move.san);
      cG.move(move.from, move.to);
      setTimeout(makeMove, 700);
    }
    setTimeout(makeMove, 700);
    return cG;
  }
}

export const slowAnim: Unit = {
  name: 'Play vs random AI; slow animations',
  run(el) {
    const chess = new Chess();
    const cG = Chessground(el, {
      animation: {
        duration: 5000
      },
      movable: {
        color: 'white',
        free: false,
        dests: toDests(chess)
      }
    });
    cG.set({
      movable: {
        events: {
          after: aiPlay(cG, chess, 1000, false)
        }
      }
    });
    return cG;
  }
};

export const conflictingHold: Unit = {
  name: 'Conflicting hold/premove',
  run(el) {
    const cG = Chessground(el, {
      fen: '8/8/5p2/4P3/8/8/8/8',
      turnColor: 'black',
      movable: {
        color: 'white',
        free: false,
        dests: new Map([
          ['e5', ['f6']]
        ])
      }
    });
    setTimeout(() => {
      cG.move('f6', 'e5');
      cG.playPremove();
      cG.set({
        turnColor: 'white',
        movable: {
          dests: undefined
        }
      });
    }, 1000);
    return cG;
  }
};
