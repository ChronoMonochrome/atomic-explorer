from server import app
from flask import Flask, render_template, render_template_string, request, jsonify, session, send_file, flash, url_for, redirect

@app.route("/")
def home():
	#return app.config["STATIC_FOLDER"]
	return render_template("index.html")