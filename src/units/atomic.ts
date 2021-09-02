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
var fen;

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

enum Files {
    A = 97, // "a".charCodeAt()
    B,
    C,
    D,
    E,
    F,
    G,
    H
};

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

function check4Nuke(cG: any, orig?: any, dest?: any) {
    if (orig == undefined || dest == undefined)
        return;

    console.debug("Moved from " + orig + " to " + dest);
    console.debug(pieces[dest]);
    
    console.debug(pieces[orig].role);
    console.debug(dest, fen.split(" ")[3]);
    
    if (pieces[orig].role == "pawn" && dest == fen.split(" ")[3]) {
        console.debug("En croissant explosion!");
        capture(cG, dest, true, fen.split(" ")[1]);
        return;
    }
    
    if (pieces[dest] != undefined) {
        console.debug("Destination square is occupied, calling a nuke on that square!");
        capture(cG, dest);
    }
}

function check4enPassant(orig?: any, dest?: any) {
    var res = "-";

    if (orig == undefined || dest == undefined)
        return res;

    if (pieces[orig].role != "pawn")
        return res;
    
    var origRank = parseInt(orig.slice(1, 2));
    var destRank = parseInt(dest.slice(1, 2));
    var rankDiff = Math.abs(origRank - destRank);
    if (rankDiff < 2)
        return res;
        
    var destFile = dest.slice(0, 1).charCodeAt();
    var adjacentFile;
    var adjacentSquare;
    var enpassantSquare;
    
    var adjacentFiles: any[] = [];
    
    if (destFile > Files.A) {
        adjacentFiles.push(destFile - 1);
    }
    
    if (destFile < Files.H) {
        adjacentFiles.push(destFile + 1);
    }
    
    for (adjacentFile of adjacentFiles) {
        adjacentSquare = String.fromCharCode(adjacentFile) + String(destRank);
        
        console.debug("dest square = " + dest + " adjSq = " + adjacentSquare);
        
        if (pieces[adjacentSquare] == undefined)
            continue;

        if (pieces[adjacentSquare].role != "pawn")
            continue;
        
        if (pieces[orig].color == pieces[adjacentSquare].color)
            continue;

        if (pieces[orig].color == "white")
            enpassantSquare = String.fromCharCode(destFile) + String(destRank - 1);
        else
            enpassantSquare = String.fromCharCode(destFile) + String(destRank + 1);

        console.debug("enpassantSquare: ");
        console.debug(enpassantSquare);
        
        res = enpassantSquare;
        break;
    }
    
    return res;
}

////////////////////////////////////////////////////
// end of code to be moved to the control class  //
//////////////////////////////////////////////////

declare global {
    interface Window { chessground: any; }
    interface Window { variant: any; }
    interface Window { setFen: any; }
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

export function setFen(cG: any, fen: any) {
	cG.set({fen: fen});
	let fenParts = fen.split(" ")
	if (fenParts.length > 4)
		movesCount = fenParts[4];
	else
		movesCount = 0;
	
	console.log(movesCount);

	move(cG);
}

export function move(cG: any, orig?: any, dest?: any) {    
    check4Nuke(cG, orig, dest);

    checkCastlingRights(orig, dest);    
    console.debug("Castling rights: ");
    console.debug(castlingRights);
    
    var fenBase = JSON.stringify(cG.getFen()).slice(1, -1);
    var fenColor = (movesCount % 2 == 0) ? "w" : "b";
    var fenCastling = castlingToFen(castlingRights);
    var fenEnpassant = check4enPassant(orig, dest);
    fen = [fenBase, fenColor, fenCastling, fenEnpassant].join(" ");
    var turnColor = toColor(fenColor);

    console.debug("Fen is: ");
    console.debug(fen);
	
	const fenInput = document.querySelector('#fen') as HTMLElement;
	//console.log(fenInput);
	fenInput.setAttribute("value", fen);
    
    getDests(fen).then(result => {
        console.debug("Available moves: ");
        console.debug(result);
        
        pieces = mapToObj(cG.state.pieces);
        console.debug("Pieces on the board:");
        console.debug(pieces);

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

export function capture(cG: Api, key: cg.Key, isEnpassant?: any, color?: any) {
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
      let explodes = p && (k === key || p.role !== 'pawn');
	  if (window.variant == "atomar") 
		  explodes &&= (p.role !== 'king');

      if (explodes) diff.set(k, undefined);
    }
  }
  
  if (isEnpassant) {
    var capturedKey;
    if (color == "w")
        capturedKey = util.pos2key([orig[0], orig[1] - 1])
    else
        capturedKey = util.pos2key([orig[0], orig[1] + 1]);
    
    console.debug("capturing pawn on " + capturedKey + " because of en croissant");
    diff.set(capturedKey, undefined);
    exploding.push(capturedKey);
    
  }
  cG.setPieces(diff);
  cG.explode(exploding);
}

export function playOtherSide(cG: any) {
  return (orig, dest) => {
    move(cG, orig, dest);
  };
}

export function getChessground(el: any, variant?: any, config?: any) {
    const cG = Chessground(el, {
      movable: {
        color: 'white',
        free: false,
      },
      draggable: {
        showGhost: true
      }
    });

    movesCount = 0;
    move(cG);
    
    if (config != undefined) {
        cG.set(config);
    }

    cG.set({
      movable: { events: { after: playOtherSide(cG) } }
    });
    
    window.chessground = cG;
    window.variant = variant;
	window.setFen = setFen;

    return cG;
}