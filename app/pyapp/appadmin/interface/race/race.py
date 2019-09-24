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


@blp.route('/enter_times', methods=['GET', 'POST'])
@roles_required_online(blp)
def enter_times():
    page_type = 'enter_times'
    editions = Edition.get_editions()
    return render_template('race.html', **locals())


@blp.route('/edit_participants', methods=['GET', 'POST'])
@roles_required_online(blp)
def edit_participants():
    page_type = 'edit_participants'
    editions = Edition.get_editions()
    return render_template('race.html', **locals())


@blp.route('/results', methods=['GET', 'POST'])
@roles_required_online(blp)
def results():
    page_type = 'results'
    editions = Edition.get_editions()
    return render_template('race.html', **locals())


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

    if json_data['action'] == 'update_participant':
        data = json_data['participant_data']
        edition_participant = db.query(
            EditionParticipant).get([data['edition_id'], data['participant_id']])
        edition_participant.set_time(data['minutes'], data['seconds'], data['hundreds'])
        edition_participant.club_id = data['club_id']
        edition_participant.penalized = data['penalized']
        edition_participant.disqualified = data['disqualified']
        edition_participant.not_arrived = data['not_arrived']
        edition_participant.not_came_out = data['not_came_out']
        edition_participant.category = data['category']

        participant = edition_participant.participant
        participant.set_data(data['name'], data['surnames'], data['birthday'])
        db.commit()
        response['message'] = locm.participant_updated.format(data['name'], data['surnames'])

    if json_data['action'] == 'update_times':
        data = json_data['participant_data']
        edition_participant = db.query(
            EditionParticipant).get([data['edition_id'], data['participant_id']])

        edition_participant.set_time_from_str(data['time'])
        edition_participant.penalized = data['penalized']
        edition_participant.disqualified = data['disqualified']
        edition_participant.not_arrived = data['not_arrived']
        edition_participant.not_came_out = data['not_came_out']

        db.commit()

    if json_data['action'] == 'delete':
        participant_id, edition_id = json_data['id'].split('_')

        edition_participant = db.query(
            EditionParticipant).get([int(edition_id), int(participant_id)])
        db.delete(edition_participant)
        db.commit()
        response['message'] = locm.delete_successful.format(
            f'{edition_participant.participant.name} {edition_participant.participant.surnames}')

    response['elapsed_time'] = time() - start
    return Response(json.dumps(response), status=200)


@blp.route('/add', methods=['GET', 'POST'])
@roles_required_online(blp)
def add():
    db = blp.db_manager
    locm = LocalizationManager().get_blueprint_locale(blp.name)

    state = None
    organizer = None
    message = None
    
    page_type = 'new_organizer'
    page_title = locm.add_organizer

    if request.method == 'POST':
        try:
            data = request.form

            """
            picture = '/static/images/NO_IMAGE.jpg'

            new_organizer = Organizer(
                name=data['name'], surnames=data['surnames'], about=data['about'], picture=picture)
            db.add(new_organizer)
            db.flush()

            # check if the post request has the file part
            if 'picture' in request.files:
                file = request.files['picture']
                new_organizer.picture = upload_small_picture(
                    blp, file, new_organizer.id)

            db.commit()
            """

            message = locm.organizer_added
            state = 'success'
        except Exception as e:
            db.rollback()
            error_msg = 'Exception: {}'.format(e)
            print(error_msg)
            state = 'error'
            message = f'{locm.error_while_adding}. {error_msg}'

    return render_template('race_add.html', **locals())

