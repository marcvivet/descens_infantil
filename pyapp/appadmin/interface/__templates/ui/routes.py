import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../../"))
from flask import Blueprint, render_template
from utils.blueprint_utils import roles_required_online


blueprint = Blueprint(
    'ui_blueprint',
    __name__,
    url_prefix='/ui',
    template_folder='templates',
    static_folder='static'
)


@blueprint.route('/<template>')
@roles_required_online(blueprint)
def route_template(template):
    return render_template(template + '.html')
