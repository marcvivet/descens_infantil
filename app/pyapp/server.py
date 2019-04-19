import os
import sys
import argparse
from flask import render_template, session
from models.interface_model import User
from logging import basicConfig, DEBUG, getLogger, StreamHandler

from app import create_app, login_manager

app = create_app()


def parse_args():
    """
    Parse input arguments
    """
    parser = argparse.ArgumentParser(
        description='Web server to process JSON files')

    parser.add_argument('-p', '--port', help='Server Port', default=10001, type=int)

    parser.add_argument('--database_type',
                        help='Let you select the database.',
                        default='SQLite',
                        choices=['SQLite', 'mySQL'])

    parser.add_argument('--use_sqlite_for_ranking_db',
                        help='Uses Local sqlite file for the ranking db',
                        action='store_true')

    args = parser.parse_args()
    return args


ROOT_FILE_PATH = os.path.abspath(os.path.dirname(__file__))
sys.path.append(os.path.join(ROOT_FILE_PATH, "interface/base"))

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)


"""
app.config.update(dict(
    SECRET_KEY=id_generator(),
    WTF_CSRF_SECRET_KEY=id_generator())
)
"""

@app.before_request
def make_session_permanent():
    session.permanent = True
    session.modified = True


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers',
                         'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods',
                         'GET,PUT,POST,DELETE,OPTIONS')
    return response


def configure_logs(app):
    if not app.debug:
        basicConfig(filename='error.log', level=DEBUG)
    logger = getLogger()
    logger.addHandler(StreamHandler())


@login_manager.unauthorized_handler
def unauthorized_handler():
    return render_template('errors/page_403.html'), 403


@app.errorhandler(403)
def access_forbidden(error):
    return render_template('errors/page_403.html'), 403


@app.errorhandler(404)
def not_found_error(error):
    return render_template('errors/page_404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    return render_template('errors/page_500.html'), 500


ARGS = parse_args()

if __name__ == "__main__":
    configure_logs(app)
    print(' * Running on http://0.0.0.0:{}/ (Press CTRL+C to quit)'.format(ARGS.port))
    #app.run(threaded=False, host='0.0.0.0', port=ARGS.port, ssl_context='adhoc')
    app.run(threaded=False, host='0.0.0.0', port=ARGS.port)


