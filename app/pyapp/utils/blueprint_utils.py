from future.utils import iteritems

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../"))

from flask import current_app
from flask_login import current_user
from functools import wraps
from flask_user.access import is_authenticated, is_confirmed_email

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



    