import { Api } from 'chessground/api';
import { Chessground }  from 'chessground';
import * as util from 'chessground/util';
import * as cg from 'chessground/types';
import { mapToObj, toColor } from '../util'


//////////////////////////////////////////////////
// code to be moved to the control class       //
////////////////////////////////////////////////
var movesCount = 0;
var pieces;

enum Castling {
    WhiteKingSide = "K",
    WhiteQueenSide = "Q",
    BlackKingSide = "k",
    BlackQueenSide = "q"
};

let castlingRights = new Map([
    [Castling.WhiteKingSide, true],
    [Castling.WhiteQueenSide, true],
    [Castling.BlackKingSide, true],
    [Castling.BlackQueenSide, true]
]);

function castlingToFen(castlingRights: any): any {
    let fen = "";
    
    if (castlingRights.get(Castling.WhiteKingSide))
        fen += "K";

    if (castlingRights.get(Castling.WhiteQueenSide))
        fen += "Q";

    
    if (castlingRights.get(Castling.BlackKingSide))
        fen += "k";

    if (castlingRights.get(Castling.BlackQueenSide))
        fen += "q";

    if (fen == "") {
        fen = "-";
    }        
 
    return fen;
}

function checkCastlingRights(orig: any, dest: any) {
    if (castlingRights.get(Castling.WhiteKingSide)) {
        // if a Rook is about to move or get captured
        if (orig == "h1" || dest == "h1") {
            // then remove corresponding castling rights
            castlingRights.set(Castling.WhiteKingSide, false);
        }
    }
    
    if (castlingRights.get(Castling.WhiteQueenSide)) {
        if (orig == "a1" || dest == "a1") {
            castlingRights.set(Castling.WhiteQueenSide, false);
        }
    }
    
    if (castlingRights.get(Castling.BlackKingSide)) {
        if (orig == "h8" || dest == "h8") {
            castlingRights.set(Castling.BlackKingSide, false);
        }
    }
    
    if (castlingRights.get(Castling.BlackQueenSide)) {
        if (orig == "a8" || dest == "a8") {
            castlingRights.set(Castling.BlackQueenSide, false);
        }
    }
    
    if (castlingRights.get(Castling.WhiteKingSide) 
                || castlingRights.get(Castling.WhiteQueenSide)) {
        if (orig == "e1") {
            castlingRights.set(Castling.WhiteKingSide, false);
            castlingRights.set(Castling.WhiteQueenSide, false);
        }
    }
    
    if (castlingRights.get(Castling.BlackKingSide) 
                || castlingRights.get(Castling.BlackQueenSide)) {
        if (orig == "e8") {
            castlingRights.set(Castling.BlackKingSide, false);
            castlingRights.set(Castling.BlackQueenSide, false);
        }
    }
}

////////////////////////////////////////////////////
// end of code to be moved to the control class  //
//////////////////////////////////////////////////

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
   
    checkCastlingRights(orig, dest);
    
    console.log("Castling rights: ");
    
    console.log(castlingRights);
    
    var fenBase = JSON.stringify(cG.getFen()).slice(1, -1);
    var fenColor = (movesCount % 2 == 0) ? "w" : "b";
    var fenCastling = castlingToFen(castlingRights);
    var fen = [fenBase, fenColor, fenCastling].join(" ");
    var turnColor = toColor(fenColor);

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