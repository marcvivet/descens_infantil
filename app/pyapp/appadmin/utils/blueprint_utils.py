import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../"))

import json

from flask import current_app, Response
from flask_login import current_user
from functools import wraps
from flask_user.access import is_authenticated, is_confirmed_email
from appadmin.utils.localization_manager import LocalizationManager

ROOT_FILE_PATH = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

config = {
    'ROOT_FILE_PATH': ROOT_FILE_PATH,
    'UPLOAD_FOLDER': os.path.join(
        ROOT_FILE_PATH, "interface/base/static/uploads/"),
    'UPLOAD_FOLDER_FOR_DATABASES': os.path.join(
        ROOT_FILE_PATH, 'interface/base/static/uploads/databases'),
    'AC_ROOT_DATABASE_PATH': os.path.join(
        ROOT_FILE_PATH, 'data/databases'),
}


def roles_required_online(blp):
    """ This decorator ensures that the current user has all of the specified roles.
        Calls the unauthorized_view_function() when requirements fail.
        See also: UserMixin.has_roles()
    """
    def wrapper(func):
        @wraps(func)
        def decorated_view(*args, **kwargs):
            # User must be logged
            if not is_authenticated():
                # Redirect to the unauthenticated page
                return current_app.user_manager.unauthenticated_view_function()

            # User must have the required roles
            if not current_user.has_roles(blp.page.allowed_roles):
                # Redirect to the unauthorized page
                return current_app.user_manager.unauthorized_view_function()

            # Call the actual view
            return func(*args, **kwargs)
        return decorated_view
    return wrapper


def safe_response(func):
    @wraps(func)
    def decorated_view(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as ex:
            error_msg = LocalizationManager().get_blueprint_locale('base').exception.format(ex)
            current_app.logger.error(error_msg)
            current_app.db_manager.rollback()
            return Response(error_msg, status=500)
    return decorated_view

"""
def localizable(blp):
    def wrapper(func):
        @wraps(func)
        def decorated_view(*args, **kwargs):
            os.path.join(blp.root_path, 'locale')

            locale = {}
            iso_639_1 = 'ca'

            if is_authenticated() and current_user.language:
                iso_639_1 = current_user.language.iso_639_1

            language_file = os.path.join(blp.root_path, 'locale', f'{iso_639_1}.json')

            if os.path.exists(language_file):
                with open(language_file, 'r') as read_fp:
                    locale = json.load(read_fp)

            locale['iso_639_1'] = iso_639_1
            
            return func(*args, locale, **kwargs)
        return decorated_view
    return wrapper
"""

    