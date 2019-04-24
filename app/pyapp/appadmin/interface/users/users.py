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


blp = Blueprint(
    'users',
    __name__,
    url_prefix='/users',
    template_folder='templates',
    static_folder='static',
    static_url_path='/static/users'
)


def check_file_type(filename):
    result = '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ['png', 'jpg', 'jpeg', 'gif', 'bmp']

    if not result:
        raise LocalizedException("incorrect_picture", blp=blp.name)


def save_centered_and_resized(picture_name, upload_folder):
    img_in = Image.open(os.path.join(upload_folder, picture_name))
    img_in.load()

    if img_in.mode == 'RGBA':
        img = Image.new("RGB", img_in.size, (255, 255, 255))
        img.paste(img_in, mask=img_in.split()[3])
    elif img_in.mode != 'RGB':
        img = img_in.convert('RGB')
    else:
        img = img_in

    width, height = img.size   # Get dimensions    

    width = np.size(img, 1)
    height = np.size(img, 0)

    new_width = np.min([width, height])

    left = np.floor((width - new_width) / 2.)
    top = np.floor((height - new_width) / 2.)
    right = np.floor(left + new_width - 1)
    bottom = np.floor(top + new_width - 1)
    img = img.crop((left, top, right, bottom))

    new_size = 400, 400
    img.thumbnail(new_size, Image.ANTIALIAS)

    os.remove(os.path.join(upload_folder, picture_name))
    new_file_name = ''
    for file_piece in picture_name.split('.')[:-1]:
        new_file_name += file_piece

    new_file_name += '.jpg'
    img.save(os.path.join(upload_folder, new_file_name), "JPEG", quality=95)

    return new_file_name


@blp.route('/add', methods=['GET', 'POST'])
@roles_required_online(blp)
def add():
    db = blp.db_manager

    _locale = LocalizationManager().get_blueprint_locale(blp.name)

    state = None
    user = None
    message = None
    page_type = 'new_user'
    page_title = _locale.add_user

    if current_user.has_role('Admin'):
        roles_available = db.get_roles()
    else:
        roles_available = current_user.roles

    if request.method == 'POST':
        try:
            data = request.form
            roles = request.form.getlist('roles')
            
            if db.query(User).filter(User.name == data['username']).count():
                raise LocalizedException(_locale.user_exists, blp=blp.name)

            picture = None
            # check if the post request has the file part
            if 'picture' in request.files:
                file = request.files['picture']

                if file.filename != '':
                    if file:
                        check_file_type(file.filename)
                        extension = file.filename.split('.')[-1]
                        picture = '{}.{}'.format(data['username'], extension)
                        file.save(os.path.join(config['UPLOAD_FOLDER'], picture))

                        picture = save_centered_and_resized(
                            picture, config['UPLOAD_FOLDER'])

            if picture:
                picture = '/static/uploads/{}'.format(picture)
            else:
                picture = '/static/images/user.png'

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
            message = _locale.user_added
            state = 'success'
        except Exception as e:
            db.rollback()
            error_msg = 'Exception: {}'.format(e)
            print(error_msg)
            state = 'error'
            message = f'{_locale.error_while_adding}. {error_msg}'

    return render_template('user_edit.html', **locals())


@blp.route('/view', methods=['GET', 'POST'])
@roles_required_online(blp)
def view():
    db = blp.db_manager

    _locale = LocalizationManager().get_blueprint_locale(blp.name)

    state = None
    message = None
    user = None

    page_type = 'users'
    page_title = _locale.edit_user

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
                    message = _locale.can_not_delete.format(user.username)

                    user_to_delete = db.query(User).get(int(data['user_id']))
                    db.delete(user_to_delete)

                    db.commit()
                    message = _locale.user_deleted.format(user.username)
                else:
                    message = _locale.can_not_edit.format(user.username)
                    return render_template('user_edit.html', str=str, **locals())
            else:
                message = _locale.error_on_edit.format(user.username)
                data = request.form
                roles = request.form.getlist('roles')

                picture = None
                # check if the post request has the file part
                if 'picture' in request.files:
                    file = request.files['picture']

                    if file.filename != '':
                        if file:
                            check_file_type(file.filename)
                            extension = file.filename.split('.')[-1]
                            picture = '{}.{}'.format(user.username, extension)
                            file.save(os.path.join(config['UPLOAD_FOLDER'], picture))

                            picture = save_centered_and_resized(
                                picture, config['UPLOAD_FOLDER'])

                if picture:
                    user.picture = '/static/uploads/{}'.format(picture)
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
                message = _locale.user_edited.format(user.username)
            
            state = 'success'
            return redirect('/users/view')
        except Exception as e:
            db.rollback()
            error_msg = _locale.exception.format(e)
            print(error_msg)
            state = 'error'
            message = _locale.error_during_edit.format(error_msg)

    users = db.query(User).filter(User.system == False).order_by(User.name).order_by(User.surname).all()
    return render_template('user_view.html', str=str, **locals())


@blp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    db = blp.db_manager
    _locale = LocalizationManager().get_blueprint_locale(blp.name)
    
    state = None
    message = None
    user = db.query(User).filter(User.id == current_user.id).one()

    page_type = 'profile'
    page_title = _locale.edit_profile

    if request.method == 'POST':
        try:
            data = request.form

            picture = None
            # check if the post request has the file part
            if 'picture' in request.files:
                file = request.files['picture']

                if file.filename != '':
                    if file:
                        check_file_type(file.filename)
                        extension = file.filename.split('.')[-1]
                        picture = '{}.{}'.format(user.username, extension)
                        file.save(os.path.join(config['UPLOAD_FOLDER'], picture))
                        picture = save_centered_and_resized(
                            picture, config['UPLOAD_FOLDER'])

            if picture:
                user.picture = '/static/uploads/{}'.format(picture)
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
            message = _locale.profile_edited
            state = 'success'

            return redirect('/users/profile')
        except Exception as e:
            db.rollback()
            error_msg = 'Exception: {}'.format(e)
            print(error_msg)
            state = 'error'
            message = _locale.profile_error.format(error_msg)

    return render_template('user_edit.html', **locals())
