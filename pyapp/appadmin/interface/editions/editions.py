import sys
import os
import json
from datetime import datetime

from sqlalchemy import exc
from datetime import date
import pandas as pd

from sqlalchemy.sql.expression import and_

from flask import Blueprint, render_template, request, redirect, Response
from flask_login import current_user
from flask_login import login_required

import requests as req
from PIL import Image
import numpy as np

from appadmin.models.descens_infantil_model import Edition, Organizer, Club, EditionParticipant, Participant
from appadmin.utils.blueprint_utils import roles_required_online
from appadmin.utils.localization_manager import LocalizedException, LocalizationManager
from appadmin.utils.image_utils import upload_small_picture
from appadmin.utils.db_manager import DBManager


blp = Blueprint(
    'editions',
    __name__,
    url_prefix='/editions',
    template_folder='templates',
    static_folder='static',
    static_url_path='/static'
)


def get_organizer(full_name: str) -> Organizer:
    organizer = None
    if full_name:
        db = blp.db_manager
        hash = Organizer.create_hash_from_full_name(full_name)
        organizer = db.query(Organizer).filter(
            Organizer.hash == hash).first()
        if not organizer:
            organizer = Organizer(*full_name.split(' ', 1))
            db.add(organizer)
            db.flush()
    
    return organizer


@blp.route('/add', methods=['GET', 'POST'])
@roles_required_online(blp)
def add():
    db = blp.db_manager
    manual_config = blp.manual_config["editions"]
    locm = LocalizationManager().get_blueprint_locale(blp.name)

    state = None
    edition = None
    message = None
    
    page_type = 'new_edition'
    page_title = locm.add_edition

    if request.method == 'POST':
        try:
            data = request.form
            picture = '/static/images/NO_IMAGE.jpg'

            # check if the post request has the file part
            if 'picture' in request.files:
                file = request.files['picture']
                picture = upload_small_picture(blp, file, data['year'])

            chief_of_course = get_organizer(data['chief_of_course'])
            start_referee = get_organizer(data['start_referee'])
            finish_referee = get_organizer(data['finish_referee'])

            new_edition = Edition(
                edition=data['edition'], date=date(int(data['year']), 1, 1),
                chief_of_course=chief_of_course, start_referee=start_referee,
                finish_referee=finish_referee, picture=picture)

            db.add(new_edition)
            db.commit()

            if 'import' in request.files:
                file = request.files['import']
                if file and file.filename:
                    df = pd.read_csv(file, encoding='latin-1')
                    df.columns = [
                        'name', 'surnames', 'club_name', 
                        'club_acronym', 'birthday'
                    ]

                    df['birthday'] = pd.to_datetime(df['birthday'], format='%d/%m/%Y')
                    df = df.sort_values(by='birthday', ascending=False).reset_index(drop=True)

                    for bib_number, (_, row) in enumerate(df.iterrows(), start=1):
                        birthday_dt = row['birthday'].to_pydatetime().date()

                        participant = db.query(Participant).filter(
                            Participant.hash == Participant.get_hash(
                                row['name'], row['surnames'], birthday_dt)).first()

                        if not participant:
                            participant = Participant(row['name'], row['surnames'], birthday_dt)
                            db.add(participant)
                            db.flush()

                        edition_participant = db.query(EditionParticipant).filter(and_(
                            EditionParticipant.participant_id == participant.id,
                            EditionParticipant.edition_id == new_edition.id)).first()

                        if edition_participant:
                            raise LocalizedException('participant_exists', blp=blp.name)

                        club = db.query(Club).filter(
                            Club.name == str(row['club_name']).title()).first() 

                        if not club:
                            club = Club(name=row['club_name'], acronym=row['club_acronym'])

                            while db.query(Club).filter(
                                Club.acronym == club.acronym).first():
                                club.acronym += '*'

                            db.add(club)
                            db.flush()

                        edition_participant = EditionParticipant(
                            new_edition, participant, club, bib_number)

                        db.add(edition_participant)
                        db.commit()


            """
            if 'import' in data and data['import'] == 'on':
                response = req.post(manual_config["set_address_list"])
                if response.status_code != 200:
                    raise Exception("Error while trying to add the IP to mikrotikapi")

                db_manager = DBManager(**manual_config["db_config"])

                result = db_manager.execute(
                    'SELECT inscrits.nom AS name, inscrits.cognoms AS surnames, '
                    'inscrits.data_naixement AS birthday, clubs.nom as club_name, '
                    'clubs.club as club_acronym '
                    'FROM inscrits, clubs '
                    'WHERE inscrits.club = clubs.id AND inscrits.pagat = 1 '
                    'ORDER BY inscrits.data_naixement DESC').fetchall()

                for bib_number, row in enumerate(result, start=1):
                    birthday = row['birthday'].date()
                    participant = db.query(Participant).filter(
                        Participant.hash == Participant.get_hash(
                            row['name'], row['surnames'], birthday)).first()

                    if not participant:
                        participant = Participant(row['name'], row['surnames'], birthday)
                        db.add(participant)
                        db.flush()

                    edition_participant = db.query(EditionParticipant).filter(and_(
                        EditionParticipant.participant_id == participant.id,
                        EditionParticipant.edition_id == new_edition.id)).first()

                    if edition_participant:
                        raise LocalizedException('participant_exists', blp=blp.name)

                    club = db.query(Club).filter(
                        Club.name == row['club_name'].title()).first()

                    if not club:
                        club = Club(name=row['club_name'], acronym=row['club_acronym'])

                        while db.query(Club).filter(
                                Club.acronym == club.acronym).first():
                            club.acronym += '*'

                        db.add(club)
                        db.flush()

                    edition_participant = EditionParticipant(
                        new_edition, participant, club, bib_number)

                    db.add(edition_participant)
                    db.commit()
                db_manager.close()
            """

            message = locm.edition_added
            state = 'success'
        except exc.IntegrityError as e:
            db.rollback()
            error_msg = locm.integrity_error
            print(error_msg)
            print(e.message)
            state = 'error'
            message = f'{locm.error_while_adding}. {error_msg}'

        except Exception as e:
            db.rollback()
            error_msg = 'Exception: {}'.format(e)
            print(error_msg)
            state = 'error'
            message = f'{locm.error_while_adding}. {error_msg}'

    return render_template('edition_edit.html', **locals())


@blp.route('/view', methods=['GET', 'POST'])
@roles_required_online(blp)
def view():
    db = blp.db_manager
    locm = LocalizationManager().get_blueprint_locale(blp.name)

    state = None
    message = None
    edition = None

    page_type = 'editions'
    page_title = locm.edit_edition

    if request.method == 'POST':
        try:
            data = request.form
            edition = db.query(Edition).get(int(data['edition_id']))

            if 'action' in data:              
                if data['action'] == 'edit':
                    message = locm.can_not_edit.format(edition.year)
                    return render_template('edition_edit.html', **locals())
            else:
                message = locm.error_on_edit.format(edition.year)
                data = request.form
                picture = '/static/images/NO_IMAGE.jpg'

                # check if the post request has the file part
                if 'picture' in request.files:
                    file = request.files['picture']
                    picture = upload_small_picture(blp, file, data['year'])

                chief_of_course = get_organizer(data['chief_of_course'])
                start_referee = get_organizer(data['start_referee'])
                finish_referee = get_organizer(data['finish_referee'])

                new_edition = Edition(
                    edition=data['edition'], date=date(int(data['year']), 1, 1),
                    chief_of_course=chief_of_course, start_referee=start_referee,
                    finish_referee=finish_referee, picture=picture)

                if picture:
                    edition.picture = picture
                    edition.mark_as_updated()

                edition.edition = data['edition']
                edition.date = date(int(data['year']), 1, 1)
                edition.chief_of_course = chief_of_course
                edition.start_referee = start_referee
                edition.finish_referee = finish_referee
                db.commit()
                message = locm.edition_edited.format(edition.edition)
            
            state = 'success'
            return redirect('/editions/view')
        except Exception as e:
            db.rollback()
            error_msg = locm.exception.format(e)
            print(error_msg)
            state = 'error'
            message = locm.error_during_edit.format(error_msg)

    editions = db.query(Edition).order_by(Edition.edition.desc()).all()
    return render_template('edition_view.html', **locals())


@blp.route('/communicate', methods=['POST'])
@roles_required_online(blp)
def communicate():
    message = None
    response = None
    status = 200
    db = blp.db_manager
    locm = LocalizationManager().get_blueprint_locale(blp.name)

    try:
        json_data = json.loads(request.data.decode('utf-8'))

        if json_data['action'] == 'get_organizers':
            message = Organizer.get_organizers()

        if json_data['action'] == 'get_next_edition':
            message = Edition.get_next_edition()

        if json_data['action'] == 'get_next_year':
            message = Edition.get_next_year()

        if json_data['action'] == 'delete':
            message = locm.can_not_delete.format(json_data['id'])
            edition = db.query(Edition).get(int(json_data['id']))
            db.delete(edition)
            db.commit()
            message = locm.edition_deleted.format(edition.edition)

        if not response:
            response = json.dumps({'message': message})
    except Exception as e:
        db.rollback()
        error_msg = locm.exception.format(e)
        print(error_msg)
        state = 'error'
        response = locm.error_during_edit.format(error_msg)
        status = 500

    return Response(response, status=status)