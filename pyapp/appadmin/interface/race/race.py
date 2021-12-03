import os
import json
import base64
from time import time
from datetime import datetime

from tempfile import TemporaryDirectory

import pdfkit
from flask import Blueprint, render_template, request, redirect, Response, current_app, make_response
from flask_login import current_user
from flask_login import login_required

from sqlalchemy.sql.expression import and_

from PIL import Image
import numpy as np

from appadmin.models.descens_infantil_model import Edition, Club, EditionParticipant, Participant
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
    
    json_data = json.loads(request.data.decode('utf-8'))

    if json_data['action'] == 'get_locale':
        response['data'] = {
            'base': LocalizationManager().get_blueprint_locale('base')._locale,
            'race': LocalizationManager().get_blueprint_locale(blp.name)._locale
        }

    if json_data['action'] == 'get_participants':
        response['data'] = Edition.get_participants(json_data['edition_id'])

    if json_data['action'] == 'get_clubs':
        response['data'] = Club.get_clubs()

    if json_data['action'] == 'get_autocomplete_data':
        clubs = Club.get_clubs()
        participants = Participant.get_names_surnames()
        editions = Edition.get_editions()

        response['data'] = {
            'clubs': clubs,
            'editions': editions,
            **participants
        }

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

    if json_data['action'] == 'list_bib_number':
        response['data'] = Edition.get_list_bib_number(json_data['edition_id'])

    if json_data['action'] == 'list_out':
        response['data'] = Edition.get_list_out(json_data['edition_id'])

    if json_data['action'] == 'list_results':
        response['data'] = Edition.get_list_results(json_data['edition_id'])

    if json_data['action'] == 'delete':
        participant_id, edition_id = json_data['id'].split('_')
        edition_participant = db.query(
            EditionParticipant).get([int(edition_id), int(participant_id)])
        EditionParticipant.delete(participant_id, edition_id)
        """
        edition_participant = db.query(
            EditionParticipant).get([int(edition_id), int(participant_id)])
        db.delete(edition_id)
        db.commit()
        """
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
            birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
            participant = db.query(Participant).filter(
                Participant.hash == Participant.get_hash(
                    data['name'], data['surnames'], birthday)).first()

            if not participant:
                participant = Participant(data['name'], data['surnames'], birthday)
                db.add(participant)
                db.flush()

            edition = db.query(Edition).get(int(data['edition']))

            edition_participant = db.query(EditionParticipant).filter(and_(
                EditionParticipant.participant_id == participant.id,
                EditionParticipant.edition_id == edition.id)).first()

            if edition_participant:
                raise LocalizedException('participant_exists', blp=blp.name)

            club = db.query(Club).get(int(data['club_id']))

            bib_number = data['bib_number']
            edition_participant = EditionParticipant(
                edition, participant, club, [None, int(bib_number)][len(bib_number) > 0])

            db.add(edition_participant)
            db.commit()

            message = locm.organizer_added
            state = 'success'
        except Exception as e:
            db.rollback()
            error_msg = 'Exception: {}'.format(e)
            print(error_msg)
            state = 'error'
            message = f'{locm.error_while_adding}. {error_msg}'

    return render_template('race_add.html', **locals())


@blp.route('/list_bib_number', methods=['GET', 'POST'])
@blp.route('/list_bib_number/<edition_id>/<edition_year>', methods=['GET', 'POST'])
@blp.route('/list_bib_number/<edition_id>/<edition_year>/<view>', methods=['GET', 'POST'])
@roles_required_online(blp)
def list_bib_number(edition_id=None, edition_year=None, view=None):
    page_type = 'list_bib_number'
    locm = LocalizationManager().get_blueprint_locale(blp.name)
    title = locm.list_bib_number
    editions = Edition.get_editions()
    if edition_id and edition_year:
        rows = Edition.get_list_bib_number(edition_id)
        with TemporaryDirectory() as temp_dir:
            logo_path = os.path.join(os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))),
                'base', 'static', 'images', 'logo_descens_color.jpg')

            with open(logo_path, "rb") as file_r:
                logo_data = base64.b64encode(file_r.read()).decode('utf-8')

            table_html = render_template('race_list_bib_number_raw.html', **locals())

            if view:
                return table_html

            file_name = f'{locm.list_bib_number}-{locm.edition}-{edition_year}.pdf'.lower().replace(
                ' ', '_')
            pdfkit.from_string(table_html, os.path.join(temp_dir, file_name))
            with open(os.path.join(temp_dir, file_name), 'rb') as file_r:
                table_pdf = file_r.read()

        response = make_response(table_pdf)
        response.headers.set('Content-Disposition', 'attachment', filename=file_name)
        response.headers.set('Content-Type', 'application/pdf')
        return response
    return render_template('race_list.html', **locals())


@blp.route('/list_out', methods=['GET', 'POST'])
@blp.route('/list_out/<edition_id>/<edition_year>', methods=['GET', 'POST'])
@blp.route('/list_out/<edition_id>/<edition_year>/<view>', methods=['GET', 'POST'])
@roles_required_online(blp)
def list_out(edition_id=None, edition_year=None, view=None):
    page_type = 'list_out'
    locm = LocalizationManager().get_blueprint_locale(blp.name)
    title = locm.category
    editions = Edition.get_editions()
    if edition_id and edition_year:
        data = Edition.get_list_out(edition_id)
        with TemporaryDirectory() as temp_dir:
            logo_path = os.path.join(os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))),
                'base', 'static', 'images', 'logo_descens_color.jpg')

            with open(logo_path, "rb") as file_r:
                logo_data = base64.b64encode(file_r.read()).decode('utf-8')

            table_html = render_template('race_list_out_raw.html', **locals())

            if view:
                return table_html

            file_name = f'{locm.list_out}-{locm.edition}-{edition_year}.pdf'.lower().replace(
                ' ', '_')
            pdfkit.from_string(table_html, os.path.join(temp_dir, file_name))
            with open(os.path.join(temp_dir, file_name), 'rb') as file_r:
                table_pdf = file_r.read()

        response = make_response(table_pdf)
        response.headers.set('Content-Disposition', 'attachment', filename=file_name)
        response.headers.set('Content-Type', 'application/pdf')
        return response

    return render_template('race_list.html', **locals())


@blp.route('/list_results', methods=['GET', 'POST'])
@blp.route('/list_results/<edition_id>/<edition_year>', methods=['GET', 'POST'])
@blp.route('/list_results/<edition_id>/<edition_year>/<view>', methods=['GET', 'POST'])
@roles_required_online(blp)
def list_results(edition_id=None, edition_year=None, view=None):
    page_type = 'list_results'
    locm = LocalizationManager().get_blueprint_locale(blp.name)
    title = locm.category
    editions = Edition.get_editions()
    if edition_id and edition_year:
        data = Edition.get_list_results(edition_id)
        edition_data = Edition.query.get(edition_id)
        with TemporaryDirectory() as temp_dir:
            logo_path = os.path.join(os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))),
                'base', 'static', 'images', 'logo_descens_color.jpg')

            with open(logo_path, "rb") as file_r:
                logo_data = base64.b64encode(file_r.read()).decode('utf-8')

            table_html = render_template('race_list_results_raw.html', **locals())

            if view:
                return table_html

            file_name = f'{locm.list_results}-{locm.edition}-{edition_year}.pdf'.lower().replace(
                ' ', '_')
            pdfkit.from_string(table_html, os.path.join(temp_dir, file_name))
            with open(os.path.join(temp_dir, file_name), 'rb') as file_r:
                table_pdf = file_r.read()

        response = make_response(table_pdf)
        response.headers.set('Content-Disposition', 'attachment', filename=file_name)
        response.headers.set('Content-Type', 'application/pdf')
        return response

    return render_template('race_list.html', **locals())
