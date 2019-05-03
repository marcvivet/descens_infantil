import sys
import os
import json

from flask import Blueprint, render_template, request, redirect, Response
from flask_login import current_user
from flask_login import login_required

from PIL import Image
import numpy as np

from appadmin.models.descens_infantil_model import Club
from appadmin.utils.blueprint_utils import roles_required_online, config
from appadmin.utils.localization_manager import LocalizedException, LocalizationManager
from appadmin.utils.image_utils import upload_small_picture


blp = Blueprint(
    'clubs',
    __name__,
    url_prefix='/clubs',
    template_folder='templates',
    static_folder='static',
    static_url_path='/static'
)


@blp.route('/add', methods=['GET', 'POST'])
@roles_required_online(blp)
def add():
    db = blp.db_manager
    locm = LocalizationManager().get_blueprint_locale(blp.name)

    state = None
    club = None
    message = None
    
    page_type = 'new_club'
    page_title = locm.add_user

    if request.method == 'POST':
        try:
            data = request.form
            emblem = '/static/images/NO_IMAGE.jpg'

            # check if the post request has the file part
            if 'emblem' in request.files:
                file = request.files['emblem']
                emblem = upload_small_picture(blp, file, data['acronym'])

            new_club = Club(name=data['name'], acronym=data['acronym'], email=data['email'],
                            phone=data['phone'], about=data['about'], emblem=emblem)

            db.add(new_club)
            db.commit()

            message = locm.club_added
            state = 'success'
        except Exception as e:
            db.rollback()
            error_msg = 'Exception: {}'.format(e)
            print(error_msg)
            state = 'error'
            message = f'{locm.error_while_adding}. {error_msg}'

    return render_template('club_edit.html', **locals())


@blp.route('/view', methods=['GET', 'POST'])
@roles_required_online(blp)
def view():
    db = blp.db_manager
    locm = LocalizationManager().get_blueprint_locale(blp.name)

    state = None
    message = None
    club = None

    page_type = 'clubs'
    page_title = locm.edit_user

    if request.method == 'POST':
        try:
            data = request.form
            club = db.query(Club).get(int(data['club_id']))

            if 'action' in data:              
                if data['action'] == 'edit':
                    message = locm.can_not_edit.format(club.name)
                    return render_template('club_edit.html', **locals())
            else:
                message = locm.error_on_edit.format(club.name)
                data = request.form
                emblem = '/static/images/NO_IMAGE.jpg'

                # check if the post request has the file part
                if 'emblem' in request.files:
                    file = request.files['emblem']
                    emblem = upload_small_picture(blp, file, data['acronym'])

                if emblem:
                    club.emblem = emblem
                    club.mark_as_updated()

                club.name = data['name']
                club.acronym = data['acronym']
                club.email = data['email']
                club.phone = data['phone']
                club.about = data['about']
                db.commit()
                message = locm.user_edited.format(club.name)
            
            state = 'success'
            return redirect('/clubs/view')
        except Exception as e:
            db.rollback()
            error_msg = locm.exception.format(e)
            print(error_msg)
            state = 'error'
            message = locm.error_during_edit.format(error_msg)

    clubs = db.query(Club).order_by(Club.name).all()
    return render_template('club_view.html', **locals())


@blp.route('/communicate', methods=['POST'])
@roles_required_online(blp)
def communicate():
    message = None
    response = None
    status = 200
    db = blp.db_manager
    locm = LocalizationManager().get_blueprint_locale(blp.name)

    try:
        json_data = json.loads(request.data.decode('utf-8'), encoding='utf8')

        if json_data['action'] == 'delete':
            message = locm.can_not_delete.format(json_data['id'])
            club = db.query(Club).get(int(json_data['id']))
            db.delete(club)
            db.commit()
            message = locm.club_deleted.format(club.name)

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