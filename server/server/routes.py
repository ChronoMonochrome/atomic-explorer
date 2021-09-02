import urllib.parse

from server import app
from flask import Flask, render_template, render_template_string, request, jsonify, session, send_file, flash, url_for, redirect

import chess
import chess.variant

from typing import Iterator

class AtomarBoard(chess.Board):

    aliases = ["Atomar", "Atomar chess"]
    uci_variant = "atomar"
    xboard_variant = "atomar"

    tbw_suffix = ".atbw"
    tbz_suffix = ".atbz"
    tbw_magic = b"\x55\x8d\xa4\x49"
    tbz_magic = b"\x91\xa9\x5e\xeb"
    connected_kings = True
    one_king = True

    def is_variant_end(self) -> bool:
        return not all(self.kings & side for side in self.occupied_co)

    def is_variant_win(self) -> bool:
        return bool(self.kings and not self.kings & self.occupied_co[not self.turn])

    def is_variant_loss(self) -> bool:
        return bool(self.kings and not self.kings & self.occupied_co[self.turn])

    def has_insufficient_material(self, color: chess.Color) -> bool:
        # Remaining material does not matter if opponent's king is already
        # captured.
        if not (self.occupied_co[not color] & self.kings):
            return False

        # Bare king can not mate.
        if not (self.occupied_co[color] & ~self.kings):
            return True

        # Queen or pawn (future queen) can give mate against bare king.
        if self.queens or self.pawns:
            return False

        # Single knight or bishop cannot mate against bare king.
        if chess.popcount(self.knights | self.bishops) == 1:
            return True

        return False

    def _attacked_for_king(self, path: chess.Bitboard, occupied: chess.Bitboard) -> bool:
        # Can castle onto attacked squares if they are connected to the
        # enemy king.
        enemy_kings = self.kings & self.occupied_co[not self.turn]
        for enemy_king in chess.scan_forward(enemy_kings):
            path &= ~chess.BB_KING_ATTACKS[enemy_king]

        return super()._attacked_for_king(path, occupied)

    def _kings_connected(self) -> bool:
        white_kings = self.kings & self.occupied_co[chess.WHITE]
        black_kings = self.kings & self.occupied_co[chess.BLACK]
        return any(chess.BB_KING_ATTACKS[sq] & black_kings for sq in chess.scan_forward(white_kings))

    def _push_capture(self, move: chess.Move, capture_square: chess.Square, piece_type: chess.PieceType, was_promoted: bool) -> None:
        explosion_radius = chess.BB_KING_ATTACKS[move.to_square] & ~self.pawns

        # Destroy castling rights.
        self.castling_rights &= ~explosion_radius
        if explosion_radius & self.kings & self.occupied_co[chess.WHITE] & ~self.promoted:
            self.castling_rights &= ~chess.BB_RANK_1
        if explosion_radius & self.kings & self.occupied_co[chess.BLACK] & ~self.promoted:
            self.castling_rights &= ~chess.BB_RANK_8
       
        # King can't capture each other
        if piece_type == chess.KING and self.piece_type_at(move.to_square) == chess.KING:
            self._remove_piece_at(move.to_square)

        # Explode all non pawns around.
        for explosion in chess.scan_forward(explosion_radius):
            _piece_type = self.piece_type_at(explosion)
            print(_piece_type)
            if _piece_type != chess.KING:
                self._remove_piece_at(explosion)

    def checkers_mask(self) -> chess.Bitboard:
        return chess.BB_EMPTY if self._kings_connected() else super().checkers_mask()

    def was_into_check(self) -> bool:
        return False

    def is_into_check(self, move: chess.Move) -> bool:
        self.push(move)
        was_into_check = self.was_into_check()
        self.pop()
        return was_into_check

    def is_legal(self, move: chess.Move) -> bool:
        if self.is_variant_end():
            return False

        if not self.is_pseudo_legal(move):
            return False

        self.push(move)
        legal = bool(self.kings) and not self.is_variant_win() and (self.is_variant_loss() or not self.was_into_check())
        self.pop()

        return legal

    def is_stalemate(self) -> bool:
        # no stalemates in Atomar
        return False

    def generate_legal_moves(self, from_mask: chess.Bitboard = chess.BB_ALL, to_mask: chess.Bitboard = chess.BB_ALL) -> Iterator[chess.Move]:
        for move in self.generate_pseudo_legal_moves(from_mask, to_mask):
            if self.is_legal(move):
                yield move

    def status(self) -> chess.Status:
        status = super().status()
        status &= ~chess.STATUS_OPPOSITE_CHECK
        if self.turn == chess.WHITE:
            status &= ~chess.STATUS_NO_WHITE_KING
        else:
            status &= ~chess.STATUS_NO_BLACK_KING
        if chess.popcount(self.checkers_mask()) <= 14:
            status &= ~chess.STATUS_TOO_MANY_CHECKERS
        status &= ~chess.STATUS_IMPOSSIBLE_CHECK
        return status
        
board = AtomarBoard()

#board = chess.variant.AtomarBoard()

def encodeFen(fen):
    return urllib.parse.quote(fen, safe = "")
    
def decodeFen(fen):
    return urllib.parse.unquote(fen)
    
def moves2chessground(moves):
    moves_dict = dict()
    
    for move in moves:
        uci = move.uci()
        from_square, to_square = uci[:2], uci[2:]
        
        if not from_square in moves_dict:
            moves_dict[from_square] = [to_square]
        else:
            moves_dict[from_square].append(to_square)
            
    return list(list(i) for i in moves_dict.items())

@app.route("/")
def home():
    #return app.config["STATIC_FOLDER"]
    return render_template("index.html")
    
@app.route("/moves")
def moves():
    fen = decodeFen(request.args.get('fen', board.fen()))

    board.set_fen(fen)
    return str(moves2chessground(board.legal_moves)).replace("'", "\"")