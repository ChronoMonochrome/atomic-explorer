from os.path import join, realpath, dirname
from flask import g, request
from flask import Flask
from flask_session import Session

from datetime import timedelta

root_dir = realpath(join(dirname(__file__), ".."))
static_dir = realpath(join(root_dir, ".."))

#flask_templates_dir = realpath(join(dirname(__file__), "templates"))
flask_templates_dir = static_dir
app = Flask(__name__, template_folder = flask_templates_dir, static_url_path='', static_folder = "../..")
app.config["TEMPLATES_DIR"] = flask_templates_dir

app.config["DATAFRAMES_DIR"] = realpath(join(dirname(__file__), "dataframes"))

app.secret_key = "development key"

app.session = Session()
app.config['SESSION_PERMANENT'] = True
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=5)
# The maximum number of items the session stores
# before it starts deleting some, default 500
app.config['SESSION_FILE_THRESHOLD'] = 100
app.session.init_app(app)
app.config.update(SESSION_COOKIE_NAME="{} session".format(app.secret_key))

app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
app.config["CACHE_TYPE"] = "null"

app.config["STATIC_FOLDER"] = static_dir

#app.config["SQLALCHEMY_DATABASE_URI"] = open(dot_env, "r").read().split("\n")[0]
#app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

#import server.models
#app.db.init_app(app)

import server.routes
