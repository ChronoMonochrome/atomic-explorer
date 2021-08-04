import { Api } from 'chessground/api';
import { Chessground }  from 'chessground';
import * as util from 'chessground/util';
import * as cg from 'chessground/types';
import { mapToObj } from '../util'

var movesCount = 0;
var pieces;

//var DEFAULT_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

declare global {
    interface Window { chessground: any; }
}

async function getDests(fen: any): Promise<Map<any, any[]>> {
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

export function move(cG: any, orig?: any, dest?: any) {    
    if (orig != undefined && dest != undefined) {
        console.log("Moved from " + orig + " to " + dest);
        console.log(pieces[dest]);
        
        if (pieces[dest] != undefined) {
            console.log("Destination square is occupied, calling a nuke on that square!");
            capture(cG, dest);
        }
    }
    
    var fen = JSON.stringify(cG.getFen()).slice(1, -1) + " " + ((movesCount % 2 == 0) ? "w" : "b");
    var turnColor = (movesCount % 2 == 0) ? "white" : "black";

    console.log("Fen is: ");
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
        
        movesCount++;
    });
}

export function capture(cG: Api, key: cg.Key) {
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

export function playOtherSide(cG: any) {
  return (orig, dest) => {
    move(cG, orig, dest);
  };
}

export function getChessground(el: any, config?: any) {
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
    
    if (config != undefined) {
        cG.set(config);
    }

    cG.set({
      movable: { events: { after: playOtherSide(cG) } }
    });
    
    window.chessground = cG;

    return cG;
}