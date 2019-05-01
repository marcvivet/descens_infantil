import sys
import os
import json

from flask import Blueprint, render_template, request, redirect, Response
from flask_login import current_user
from flask_login import login_required

from PIL import Image
import numpy as np

from appadmin.models.descens_infantil_model import Edition
from appadmin.utils.blueprint_utils import roles_required_online, config
from appadmin.utils.localization_manager import LocalizedException, LocalizationManager
from appadmin.utils.image_utils import upload_small_picture


blp = Blueprint(
    'editions',
    __name__,
    url_prefix='/editions',
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
    edition = None
    message = None
    
    page_type = 'new_edition'
    page_title = locm.add_user

    if request.method == 'POST':
        try:
            data = request.form
            emblem = '/static/images/editions/NO_LOGO.jpg'

            # check if the post request has the file part
            if 'emblem' in request.files:
                file = request.files['emblem']
                emblem = upload_small_picture(blp, file, data['acronym'])

            new_edition = edition(name=data['name'], acronym=data['acronym'], email=data['email'],
                            phone=data['phone'], about=data['about'], emblem=emblem)

            db.add(new_edition)
            db.commit()

            message = locm.edition_added
            state = 'success'
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
    page_title = locm.edit_user

    if request.method == 'POST':
        try:
            data = request.form
            edition = db.query(edition).get(int(data['edition_id']))

            if 'action' in data:              
                if data['action'] == 'edit':
                    message = locm.can_not_edit.format(edition.name)
                    return render_template('edition_edit.html', str=str, **locals())
            else:
                message = locm.error_on_edit.format(edition.name)
                data = request.form
                emblem = '/static/images/editions/NO_LOGO.jpg'

                # check if the post request has the file part
                if 'emblem' in request.files:
                    file = request.files['emblem']
                    emblem = upload_small_picture(blp, file, data['acronym'])

                if emblem:
                    edition.emblem = emblem
                    edition.mark_as_updated()

                edition.name = data['name']
                edition.acronym = data['acronym']
                edition.email = data['email']
                edition.phone = data['phone']
                edition.about = data['about']
                db.commit()
                message = locm.user_edited.format(edition.name)
            
            state = 'success'
            return redirect('/editions/view')
        except Exception as e:
            db.rollback()
            error_msg = locm.exception.format(e)
            print(error_msg)
            state = 'error'
            message = locm.error_during_edit.format(error_msg)

    editions = db.query(edition).order_by(edition.name).all()
    return render_template('edition_view.html', str=str, **locals())


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
            message = locm.can_not_delete.format(json_data['edition_id'])
            edition = db.query(edition).get(int(json_data['edition_id']))
            db.delete(edition)
            db.commit()
            message = locm.edition_deleted.format(edition.name)

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