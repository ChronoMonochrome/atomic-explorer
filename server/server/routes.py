import urllib.parse

from server import app
from flask import Flask, render_template, render_template_string, request, jsonify, session, send_file, flash, url_for, redirect

import chess
import chess.variant

board = chess.variant.AtomicBoard()

def encodeFen(fen):
	return urllib.parse.quote(fen).replace("/", "_")
	
def decodeFen(fen):
	return urllib.parse.unquote(fen).replace("_", "/")
	
def moves2chessground(moves):
	moves_dict = dict()
	
	for move in moves:
		uci = move.uci()
		from_square, to_square = uci[:2], uci[2:]
		
		if not from_square in moves_dict:
			moves_dict[from_square] = [to_square]
		else:
			moves_dict[from_square].append(to_square)
			
	return moves_dict

@app.route("/")
def home():
	#return app.config["STATIC_FOLDER"]
	return render_template("index.html")
	
@app.route("/moves")
def moves():
	fen = request.args.get('fen', board.fen())

	return str(moves2chessground(board.legal_moves))