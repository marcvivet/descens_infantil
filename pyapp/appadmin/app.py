
import os
import sys
import string
import random
import json
from importlib import import_module
from datetime import timedelta

from flask import Flask
from flask import render_template
from flask_login import LoginManager
from flask_user import UserManager, SQLAlchemyAdapter

from appadmin.utils.db_manager import DBManager
from appadmin.utils.localization_manager import LocalizationManager
from appadmin.models.interface_model import db, User
from appadmin.utils.version import __version__ as version


login_manager = LoginManager()
ROOT_FILE_PATH = os.path.abspath(os.path.dirname(__file__))


def id_generator(size=16, chars=string.ascii_uppercase + string.digits):
    if not 'b' in version:
        return ''.join(random.choice(chars) for _ in range(size))
    return "1234"


class ConfigClass(object):
    """ Flask application config """

    # Flask settings
    SECRET_KEY = id_generator()
    WTF_CSRF_SECRET_KEY = id_generator()
    SESSION_UID = id_generator()

    AC_ROOT_FILE_PATH = ROOT_FILE_PATH
    AC_ROOT_DATABASE_PATH = os.path.join(ROOT_FILE_PATH, 'data/databases/')

    # Flask-SQLAlchemy settings
    SQLALCHEMY_DATABASE_URI = 'sqlite:///{}'.format(
        os.path.join(ROOT_FILE_PATH, 'data/databases/moviesdb.sqlite'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False    # Avoids SQLAlchemy warning

    # Flask-Mail SMTP server settings
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 465
    MAIL_USE_SSL = True
    MAIL_USE_TLS = False

    # Flask-Mail SMTP account settings
    MAIL_USERNAME = 'email@example.com'
    MAIL_PASSWORD = 'password'

    # Flask-User settings
    USER_APP_NAME = "Annotation Corrector"      # Shown in and email templates and page footers
    USER_ENABLE_EMAIL = False        # Enable email authentication
    USER_ENABLE_USERNAME = False    # Disable username authentication
    USER_ENABLE_CHANGE_USERNAME = False
    USER_ENABLE_REGISTER = False
    USER_EMAIL_SENDER_NAME = USER_APP_NAME
    USER_EMAIL_SENDER_EMAIL = "noreply@example.com"

    UPLOAD_FOLDER = os.path.join(
        ROOT_FILE_PATH, "interface/base/static/uploads/")

    USER_LOGIN_URL = '/login'
    USER_LOGOUT_URL = '/logout'

    USER_CHANGE_PASSWORD_URL = '/'
    USER_CHANGE_USERNAME_URL = '/'
    USER_CONFIRM_EMAIL_URL = '/'
    USER_EDIT_USER_PROFILE_URL = '/'
    USER_EMAIL_ACTION_URL = '/'
    USER_FORGOT_PASSWORD_URL = '/'
    USER_INVITE_USER_URL = '/'
    USER_MANAGE_EMAILS_URL = '/'
    USER_REGISTER_URL = '/'
    USER_RESEND_EMAIL_CONFIRMATION_URL = '/'
    USER_RESET_PASSWORD_URL = '/'

    # Endpoints are converted to URLs using url_for()
    # The empty endpoint ('') will be mapped to the root URL ('/')
    USER_AFTER_CHANGE_PASSWORD_ENDPOINT      = ''              # v0.5.3 and up
    USER_AFTER_CHANGE_USERNAME_ENDPOINT      = ''              # v0.5.3 and up
    USER_AFTER_CONFIRM_ENDPOINT              = ''              # v0.5.3 and up
    USER_AFTER_FORGOT_PASSWORD_ENDPOINT      = ''              # v0.5.3 and up
    USER_AFTER_LOGIN_ENDPOINT                = ''              # v0.5.3 and up
    USER_AFTER_LOGOUT_ENDPOINT               = 'user.login'    # v0.5.3 and up
    USER_AFTER_REGISTER_ENDPOINT             = ''              # v0.5.3 and up
    USER_AFTER_RESEND_CONFIRM_EMAIL_ENDPOINT = ''              # v0.5.3 and up
    USER_AFTER_RESET_PASSWORD_ENDPOINT       = ''              # v0.6 and up
    USER_INVITE_ENDPOINT                     = ''              # v0.6.2 and up

    # Users with an unconfirmed email trying to access a view that has been
    # decorated with @confirm_email_required will be redirected to this endpoint
    USER_UNCONFIRMED_EMAIL_ENDPOINT          = 'user.login'    # v0.6 and up

    # Unauthenticated users trying to access a view that has been decorated
    # with @login_required or @roles_required will be redirected to this endpoint
    USER_UNAUTHENTICATED_ENDPOINT            = 'user.login'    # v0.5.3 and up

    # Unauthorized users trying to access a view that has been decorated
    # with @roles_required will be redirected to this endpoint
    USER_UNAUTHORIZED_ENDPOINT               = ''              # v0.5.3 and up



def create_app():
    
    print(ROOT_FILE_PATH)

    sys.path.append(os.path.join(ROOT_FILE_PATH, "interface/base"))

    
    """Set up and starts the web server
    """


    def setup_blueprint(app, blp, page_name, description=None, no_admin=False):
        blp.page = app.db_manager.get_page_by_name(page_name.split('.')[-1])
        if not blp.page:
            if no_admin:
                blp.page = app.db_manager.add_page(
                    page_name, description=description, default_role=None)
            else:
                blp.page = app.db_manager.add_page(
                    page_name, description=description)

        @blp.context_processor
        def inject_blp_locale():
            return dict(
                blocale=LocalizationManager().get_blueprint_locale(blp.name), PRODUCTION='b' not in version, str=str, len=len)

        @blp.errorhandler(403)
        def access_forbidden(error):
            return render_template('errors/page_403.html'), 403


        @blp.errorhandler(404)
        def not_found_error(error):
            return render_template('errors/page_404.html'), 404


        @blp.errorhandler(500)
        def internal_error(error):
            return render_template('errors/page_500.html'), 500

        blp.errors = {
            'access_forbidden': lambda : access_forbidden(None),
            'not_found_error': lambda : not_found_error(None),
            'internal_error': lambda : internal_error(None)
        }


    def register_template_blueprints(app):
        for module_name in ('forms', 'ui', 'tables', 'data', 'additional'):
            module = import_module(
                'interface.__templates.{}.routes'.format(module_name))
            module.blueprint.db_manager = app.db_manager
            module.blueprint.config = app.config
            module.blueprint.page = app.db_manager.get_page_by_name('templates')
            app.register_blueprint(module.blueprint)


    def register_blueprints(app):
        interface_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), 'interface')
        pages = [page for page in os.listdir(interface_path) if not page.startswith('__')]

        for module_name in pages:
            print('Loading module: {}'.format(module_name))
            module = import_module(
                'appadmin.interface.{}.{}'.format(module_name, module_name))

            locale_manager = LocalizationManager()
            locale_manager.add_blueprint(module.blp)
           
            setup_blueprint(app, module.blp, module_name)
            module.blp.db_manager = app.db_manager
            app.register_blueprint(module.blp)

    def register_blueprints_production(app):
        import appadmin.interface.base.base as base_blp
        import appadmin.interface.clubs.clubs as clubs_blp
        import appadmin.interface.editions.editions as editions_blp
        import appadmin.interface.main.main as main_blp
        import appadmin.interface.roles.roles as roles_blp
        import appadmin.interface.race.race as race_blp
        import appadmin.interface.organizers.organizers as organizers_blp
        import appadmin.interface.statistics.statistics as statistics_blp
        import appadmin.interface.users.users as users_blp

        modules = {
            'base': base_blp,
            'clubs': clubs_blp,
            'editions': editions_blp,
            'main': main_blp,
            'organizers': organizers_blp,
            'race': race_blp,
            'roles': roles_blp,
            'statistics': statistics_blp,
            'users': users_blp
        }

        for module_name, module in modules.items():
            locale_manager = LocalizationManager()
            locale_manager.add_blueprint(module.blp)
           
            setup_blueprint(app, module.blp, module_name)
            module.blp.db_manager = app.db_manager
            app.register_blueprint(module.blp)
    
    app = Flask(
        __name__, static_url_path='/static',
        static_folder=os.path.join(ROOT_FILE_PATH, "interface/base/static"))

    login_manager.init_app(app)
    app.db_manager = DBManager(data_base_name='descens_infantil')
    app.config.from_object(__name__+'.ConfigClass')
    app.config['SQLALCHEMY_DATABASE_URI'] = app.db_manager.data_base_local_path

    if 'b' in version:
        app.jinja_env.auto_reload = True
        app.config['TEMPLATES_AUTO_RELOAD'] = True

    if not 'b' in version:
        register_blueprints_production(app)
    else:
        register_blueprints(app)
        register_template_blueprints(app)

    db.init_app(app)

    db_adapter = SQLAlchemyAdapter(db, User)
    user_manager = UserManager(db_adapter)
    user_manager.init_app(app)

    UPLOAD_FOLDER_FOR_DATABASES = os.path.join(
        app.config['AC_ROOT_FILE_PATH'], 'interface/base/static/uploads/databases')

    if not os.path.isdir(UPLOAD_FOLDER_FOR_DATABASES):
        os.makedirs(UPLOAD_FOLDER_FOR_DATABASES)

    app.permanent_session_lifetime = timedelta(hours=24)

    app.is_configured = True

    return app

