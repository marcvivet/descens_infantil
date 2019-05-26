import os
import json
from time import time

from flask import Blueprint, render_template, request, redirect, Response, current_app
from flask_login import current_user
from flask_login import login_required

from PIL import Image
import numpy as np

from appadmin.models.descens_infantil_model import Edition, Club, EditionParticipant
from appadmin.utils.blueprint_utils import roles_required_online, config, safe_response
from appadmin.utils.localization_manager import LocalizedException, LocalizationManager
from appadmin.utils.image_utils import upload_small_picture


blp = Blueprint(
    'race',
    __name__,
    url_prefix='/race',
    template_folder='templates',
    static_folder='static',
    static_url_path='/static'
)


@blp.route('/view', methods=['GET', 'POST'])
@roles_required_online(blp)
def view():
    editions = Edition.get_editions()
    return render_template('participant_view.html', **locals())


@blp.route('/communicate', methods=['POST'])
@roles_required_online(blp)
@safe_response
def communicate():
    start = time()

    db = blp.db_manager
    locm = LocalizationManager().get_blueprint_locale(blp.name)

    response = {
        'data': None,
        'elapsed_time': None
    }
    
    json_data = json.loads(request.data.decode('utf-8'), encoding='utf8')

    if json_data['action'] == 'get_locale':
        response['data'] = {
            'base': LocalizationManager().get_blueprint_locale('base')._locale,
            'race': LocalizationManager().get_blueprint_locale(blp.name)._locale
        }

    if json_data['action'] == 'get_participants':
        response['data'] = Edition.get_participants(json_data['edition_id'])

    if json_data['action'] == 'get_clubs':
        response['data'] = Club.get_clubs()

    if json_data['action'] == 'delete':
        participant_id, edition_id = json_data['id'].split('_')

        response['message'] = locm.can_not_delete.format(participant_id, edition_id)
        edition_participant = db.query(
            EditionParticipant).get([int(edition_id), int(participant_id)])
        message_success = locm.delete_successful.format(
            f'{edition_participant.participant.name} {edition_participant.participant.surnames}')

        db.delete(edition_participant)
        db.commit()
        response['message'] = message_success

    response['elapsed_time'] = time() - start
    return Response(json.dumps(response), status=200)
