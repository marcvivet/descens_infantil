import os
import json

from flask import Blueprint, render_template, request, Response
from flask_login import login_required

from appadmin.utils.blueprint_utils import roles_required_online
from appadmin.utils.localization_manager import LocalizationManager
from appadmin.models.descens_infantil_model import Edition, Organizer


blp = Blueprint(
    'statistics',
    __name__,
    url_prefix='/statistics',
    template_folder='templates',
    static_folder='static',
    static_url_path='/static'
)

@blp.route('/editions', methods=['GET'])
@login_required
def editions():
    return render_template('statistics_editions.html', **locals())


@blp.route('/communicate', methods=['POST'])
@roles_required_online(blp)
def communicate():
    message = None
    response = None
    status = 200

    try:
        json_data = json.loads(request.data.decode('utf-8'), encoding='utf8')

        if json_data['action'] == 'get_locale':
            message = LocalizationManager().get_blueprint_locale(blp.name)._locale

        if json_data['action'] == 'get_number_of_participants_per_edition':
            message = Edition.get_number_of_participants_per_edition()

        if json_data['action'] == 'get_number_of_clubs_per_edition':
            message = Edition.get_number_of_clubs_per_edition()
        
        if not response:
            response = json.dumps({'message': message})
    except Exception as e:
        blp.db_manager.rollback()
        locm = LocalizationManager().get_blueprint_locale(blp.name)
        error_msg = locm.exception.format(e)
        print(error_msg)
        state = 'error'
        response = error_msg
        status = 500

    return Response(response, status=status)
