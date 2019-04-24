import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../"))

from flask import Blueprint, render_template, request
from flask_login import login_required

from models.interface_model import Role, Page

import json

blp = Blueprint(
    'main_blueprint',
    __name__,
    url_prefix='',
    template_folder='templates'
)

@blp.route('/main', methods=['GET', 'POST'])
@login_required
def main():
    return render_template('main_page.html', **locals())


@blp.errorhandler(403)
def access_forbidden(error):
    return render_template('errors/page_403.html'), 403


@blp.errorhandler(404)
def not_found_error(error):
    return render_template('errors/page_404.html'), 404


@blp.errorhandler(500)
def internal_error(error):
    return render_template('errors/page_500.html'), 500
