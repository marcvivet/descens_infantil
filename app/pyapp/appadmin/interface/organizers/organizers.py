import sys
import os
import json

from flask import Blueprint, render_template, request, redirect, Response
from flask_login import current_user
from flask_login import login_required

from PIL import Image
import numpy as np

from appadmin.models.descens_infantil_model import Organizer
from appadmin.utils.blueprint_utils import roles_required_online, config
from appadmin.utils.localization_manager import LocalizedException, LocalizationManager
from appadmin.utils.image_utils import upload_small_picture


blp = Blueprint(
    'organizers',
    __name__,
    url_prefix='/organizers',
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
    organizer = None
    message = None
    
    page_type = 'new_organizer'
    page_title = locm.add_organizer

    if request.method == 'POST':
        try:
            data = request.form

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

            message = locm.organizer_added
            state = 'success'
        except Exception as e:
            db.rollback()
            error_msg = 'Exception: {}'.format(e)
            print(error_msg)
            state = 'error'
            message = f'{locm.error_while_adding}. {error_msg}'

    return render_template('organizer_edit.html', **locals())


@blp.route('/view', methods=['GET', 'POST'])
@roles_required_online(blp)
def view():
    db = blp.db_manager
    locm = LocalizationManager().get_blueprint_locale(blp.name)

    state = None
    message = None
    organizer = None

    page_type = 'organizers'
    page_title = locm.edit_organizer

    if request.method == 'POST':
        try:
            data = request.form
            organizer = db.query(Organizer).get(int(data['organizer_id']))

            if 'action' in data:              
                if data['action'] == 'edit':
                    message = locm.can_not_edit.format(organizer.name)
                    return render_template('organizer_edit.html', **locals())
            else:
                message = locm.error_on_edit.format(organizer.name)
                data = request.form
                picture = '/static/images/NO_IMAGE.jpg'

                # check if the post request has the file part
                if 'picture' in request.files:
                    file = request.files['picture']
                    organizer.picture = upload_small_picture(
                        blp, file, organizer.id)
                    organizer.mark_as_updated()

                organizer.name = data['name']
                organizer.surnames = data['surnames']
                organizer.about = data['about']
                db.commit()
                message = locm.user_edited.format(organizer.full_name)
            
            state = 'success'
            return redirect('/organizers/view')
        except Exception as e:
            db.rollback()
            error_msg = locm.exception.format(e)
            print(error_msg)
            state = 'error'
            message = locm.error_during_edit.format(error_msg)

    organizers = db.query(Organizer).order_by(Organizer.name).all()
    return render_template('organizer_view.html', **locals())


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
            organizer = db.query(Organizer).get(int(json_data['id']))
            db.delete(organizer)
            db.commit()
            message = locm.organizer_deleted.format(organizer.name)

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