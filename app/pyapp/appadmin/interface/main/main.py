import os

from flask import Blueprint, render_template, request
from flask_login import login_required


blp = Blueprint(
    'main',
    __name__,
    url_prefix='/main',
    template_folder='templates',
    static_folder='static',
    static_url_path='/static'
)

@blp.route('/', methods=['GET'])
@login_required
def main():
    return render_template('main_page.html', **locals())
