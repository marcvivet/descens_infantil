import sys
import os

from flask import Blueprint, render_template, request, redirect
from flask_login import current_user
from flask_login import login_required

from PIL import Image
import numpy as np

from appadmin.models.interface_model import User, Role, Language
from appadmin.utils.blueprint_utils import roles_required_online, config
from appadmin.utils.localization_manager import LocalizedException, LocalizationManager
from appadmin.utils.image_utils import upload_square_picture


blp = Blueprint(
    'users',
    __name__,
    url_prefix='/users',
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
    user = None
    message = None
    
    page_type = 'new_user'
    page_title = locm.add_user

    if current_user.has_role('Admin'):
        roles_available = db.get_roles()
    else:
        roles_available = current_user.roles

    if request.method == 'POST':
        try:
            data = request.form
            roles = request.form.getlist('roles')
            
            if db.query(User).filter(User.name == data['username']).count():
                raise LocalizedException(locm.user_exists, blp=blp.name)

            picture = '/static/images/user.png'
            # check if the post request has the file part
            if 'picture' in request.files:
                file = request.files['picture']

                picture = upload_square_picture(blp, file, data['username'])

            if request.form.get('active'):
                active = True
            else:
                active = False

            new_user = User(data['username'], password=data['password'],
                            name=data['name'], surname=data['surname'], email=data['email'],
                            phone=data['phone'], about=data['about'], active=active,
                            picture=picture)

            language = db.query(Language).filter(Language.iso_639_1 == data['language']).one()
            new_user.language = language

            db.add(new_user)

            for role in roles:
                new_user.roles.append(db.query(Role).filter(Role.name == role).one())

            db.add(new_user)
            db.commit()
            message = locm.user_added
            state = 'success'
        except Exception as e:
            db.rollback()
            error_msg = 'Exception: {}'.format(e)
            print(error_msg)
            state = 'error'
            message = f'{locm.error_while_adding}. {error_msg}'

    return render_template('user_edit.html', **locals())


@blp.route('/view', methods=['GET', 'POST'])
@roles_required_online(blp)
def view():
    db = blp.db_manager

    locm = LocalizationManager().get_blueprint_locale(blp.name)

    state = None
    message = None
    user = None

    page_type = 'users'
    page_title = locm.edit_user

    if current_user.has_role('Admin'):
        roles_available = db.get_roles()
    else:
        roles_available = current_user.roles

    if request.method == 'POST':
        try:
            data = request.form
            user = db.query(User).get(int(data['user_id']))
            user_roles = user.list_roles()

            if 'action' in data:              
                if data['action'] == 'delete':
                    message = locm.can_not_delete.format(user.username)

                    user_to_delete = db.query(User).get(int(data['user_id']))
                    db.delete(user_to_delete)

                    db.commit()
                    message = locm.user_deleted.format(user.username)
                else:
                    message = locm.can_not_edit.format(user.username)
                    return render_template('user_edit.html', **locals())
            else:
                message = locm.error_on_edit.format(user.username)
                data = request.form
                roles = request.form.getlist('roles')

                picture = None
                # check if the post request has the file part
                if 'picture' in request.files:
                    file = request.files['picture']

                    picture = upload_square_picture(blp, file, user.username)

                if picture:
                    user.picture = picture
                    user.mark_as_updated()

                if request.form.get('active'):
                    active = True
                else:
                    active = False

                if data['password']:
                    user.setPassword(data['password'])

                user.name = data['name']
                user.surname = data['surname']
                user.email = data['email']
                user.phone = data['phone']
                user.about = data['about']
                user.active = active

                user.roles = []
                for role in roles:
                    user.roles.append(db.query(Role).filter(Role.name == role).one())

                db.commit()
                message = locm.user_edited.format(user.username)
            
            state = 'success'
            return redirect('/users/view')
        except Exception as e:
            db.rollback()
            error_msg = locm.exception.format(e)
            print(error_msg)
            state = 'error'
            message = locm.error_during_edit.format(error_msg)

    users = db.query(User).filter(User.system == False).order_by(User.name).order_by(User.surname).all()
    return render_template('user_view.html', **locals())


@blp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    db = blp.db_manager
    locm = LocalizationManager().get_blueprint_locale(blp.name)
    
    state = None
    message = None
    user = db.query(User).filter(User.id == current_user.id).one()

    page_type = 'profile'
    page_title = locm.edit_profile

    if request.method == 'POST':
        try:
            data = request.form

            picture = None
            # check if the post request has the file part
            if 'picture' in request.files:
                file = request.files['picture']
                picture = upload_square_picture(blp, file, user.username)

            if picture:
                user.picture = picture
                user.mark_as_updated()

            user.name = data['name']
            user.surname = data['surname']
            user.about = data['about']
            user.email = data['email']
            user.phone = data['phone']
            user.about = data['about']

            language = db.query(Language).filter(Language.iso_639_1 == data['language']).one()
            user.language = language

            if data['password']:
                user.setPassword(data['password'])

            db.commit()
            message = locm.profile_edited
            state = 'success'

            return redirect('/users/profile')
        except Exception as e:
            db.rollback()
            error_msg = 'Exception: {}'.format(e)
            print(error_msg)
            state = 'error'
            message = locm.profile_error.format(error_msg)

    return render_template('user_edit.html', **locals())
