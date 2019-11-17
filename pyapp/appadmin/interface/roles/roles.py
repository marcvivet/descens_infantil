import os
import json

from flask import Blueprint, render_template, request
from appadmin.models.interface_model import Role, Page
from appadmin.utils.blueprint_utils import roles_required_online
from appadmin.utils.localization_manager import LocalizedException, LocalizationManager


blp = Blueprint(
    'roles',
    __name__,
    url_prefix='/roles',
    template_folder='templates',
    static_folder='static',
    static_url_path='/static'
)

@blp.route('/<action>', methods=['GET', 'POST'])
@blp.route('/<action>/<role_id>', methods=['GET', 'POST'])
@roles_required_online(blp)
def vew_roles(action, role_id=None):
    db = blp.db_manager

    _locale = LocalizationManager().get_blueprint_locale(blp.name)

    state = None
    message = None

    try:
        if action == 'view':
            role_data = db.get_roles()
            return render_template('roles_view.html', **locals())
        
        if not role_id or role_id == 1:
            return render_template('errors/page_403.html'), 403

        if action == 'delete':
            message = _locale.delete_message_error.format(role_id)
            name = db.delete_role_by_id(int(role_id))
            db.commit()
            role_data = db.get_roles()
            message =  _locale.delete_message_success.format(name)
            return render_template('roles_view.html', **locals())

        if action == 'edit':
            page_title = _locale.title_edit

            role = db.get_role_by_id(int(role_id))
            message = _locale.edit_message_error.format(role.name)

            role_pages = role.allowed_pages
            pages = db.get_pages()

            if request.method == 'POST':
                message = _locale.edit_message_error_2.format(role.name)
                data = request.form
                pages = request.form.getlist('pages')

                role.pages = []
                for page in pages:
                    role.pages.append(db.query(Page).filter(Page.id == int(page)).one())

                role.pages.append(db.query(Page).filter(Page.name == "main").one())
                role.pages.append(db.query(Page).filter(Page.name == "base").one())

                role.name = data['name']
                role.description = data['description']

                db.commit()

                message = _locale.edit_message_success
                state = 'success'
                role_data = db.get_roles()
                return render_template('roles_view.html', **locals())

            return render_template('roles_edit.html', **locals())

        raise LocalizedException('error_access', blp=blp.name)
    except Exception as e:
        db.rollback()
        error_msg = _locale.error_generic.format(e)      
        print(error_msg)
        state = 'error'

        if 'UNIQUE constraint' in error_msg:
            message = _locale.error_unique_name
        else:
            message = _locale.error_while_edit.format(error_msg)

    role_data = db.get_roles()
    return render_template('roles_view.html', **locals())

@blp.route('/add', methods=['GET', 'POST'])
@roles_required_online(blp)
def add_role():
    db = blp.db_manager

    _locale = LocalizationManager().get_blueprint_locale(blp.name)

    state = None
    message = None
    page_title = _locale.title_create

    pages = db.get_pages()

    if request.method == 'POST':
        try:
            data = request.form
            pages = request.form.getlist('pages')

            if Role.query.filter(Role.name == data['name']).count():
                raise LocalizedException("user_name_exists", blp=blp.name)

            new_role = Role(data['name'], description=data['description'])

            for page in pages:
                new_role.pages.append(db.query(Page).filter(Page.id == page).one())

            new_role.pages.append(db.query(Page).filter(Page.name == "main").one())
            new_role.pages.append(db.query(Page).filter(Page.name == "base").one())

            db.add(new_role)
            db.commit()
            message = _locale.add_message_success
            state = 'success'
        except Exception as e:
            error_msg = _locale.error_generic.format(e)
            print(error_msg)
            state = 'error'
            message = _locale.error_while_create.format(error_msg)

    return render_template('roles_edit.html', **locals())
