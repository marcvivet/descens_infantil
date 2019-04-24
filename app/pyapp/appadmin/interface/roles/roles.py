import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../"))

from flask import Blueprint, render_template, request

from models.interface_model import Role, Page

import json

from utils.blueprint_utils import roles_required_online

blp = Blueprint(
    'roles',
    __name__,
    url_prefix='/roles',
    template_folder='templates',
    static_folder='static',
    static_url_path='/static/roles'
)

@blp.route('/<action>', methods=['GET', 'POST'])
@blp.route('/<action>/<role_id>', methods=['GET', 'POST'])
@roles_required_online(blp)
def vew_roles(action, role_id=None):
    db = blp.db_manager

    state = None
    message = None

    try:
        if action == 'view':
            role_data = db.get_roles()
            return render_template('roles_view.html', **locals())
        
        if not role_id or role_id == 1:
            return render_template('errors/page_403.html'), 403

        if action == 'delete':
            message = "Could not delete role with id {}".format(role_id)
            name = db.delete_role_by_id(int(role_id))
            db.commit()
            role_data = db.get_roles()
            message = "Role {} deleted correctly".format(name)
            return render_template('roles_view.html', **locals())

        if action == 'edit':
            page_title = 'Edit Role'

            role = db.get_role_by_id(int(role_id))
            message = "Could not edit role {}".format(role.name)

            role_pages = role.allowed_pages
            pages = db.get_pages()

            if request.method == 'POST':
                message = "An error occurred when trying to edit Role {}".format(role.name)
                data = request.form
                pages = request.form.getlist('pages')

                role.pages = []
                for page in pages:
                    role.pages.append(db.query(Page).filter(Page.id == int(page)).one())

                role.name = data['name']
                role.description = data['description']

                db.commit()

                message = 'Role edited correctly!'
                state = 'success'
                role_data = db.get_roles()
                return render_template('roles_view.html', **locals())

            return render_template('roles_edit.html', **locals())

        raise Exception('Unauthorized access!')
    except Exception as e:
        db.rollback()
        error_msg = 'Exception: {}'.format(e)      
        print(error_msg)
        state = 'error'

        if 'UNIQUE constraint' in error_msg:
            message = 'Role name must be unique!'
        else:
            message = 'An error occurred while trying to edit an user. {}'.format(error_msg)

    role_data = db.get_roles()
    return render_template('roles_view.html', **locals())

@blp.route('/add', methods=['GET', 'POST'])
@roles_required_online(blp)
def add_role():
    db = blp.db_manager

    state = None
    message = None
    page_title = 'Create new Role'

    pages = db.get_pages()

    if request.method == 'POST':
        try:
            data = request.form
            pages = request.form.getlist('pages')

            if Role.query.filter(Role.name == data['name']).count():
                raise Exception('This username already exists!')

            new_role = Role(data['name'], description=data['description'])

            for page in pages:
                new_role.pages.append(db.query(Page).filter(Page.id == page).one())

            db.add(new_role)
            db.commit()
            message = 'Role added correctly!'
            state = 'success'
        except Exception as e:
            error_msg = 'Exception: {}'.format(e)
            print(error_msg)
            state = 'error'
            message = 'An error occurred while trying to add a new user. {}'.format(error_msg)

    return render_template('roles_edit.html', **locals())



@blp.errorhandler(403)
def access_forbidden(error):
    return render_template('errors/page_403.html'), 403


@blp.errorhandler(404)
def not_found_error(error):
    return render_template('errors/page_404.html'), 404


@blp.errorhandler(500)
def internal_error(error):
    return render_template('errors/page_500.html'), 500
