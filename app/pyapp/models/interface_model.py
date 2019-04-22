
import hashlib
from unidecode import unidecode
from datetime import date, time
from flask_sqlalchemy import SQLAlchemy
from passlib.hash import bcrypt
from flask_user import UserMixin
from urllib.parse import quote_plus

db = SQLAlchemy()

class Page(db.Model):
    __tablename__ = 'pages'
    id = db.Column(
        db.Integer, primary_key=True)
    name = db.Column(db.String(16), nullable=False, unique=True)
    description = db.Column(db.String(64), nullable=True)

    roles = db.relationship('Role', secondary='role_pages', order_by='Role.id')

    def __init__(self, name, description=None):
        self.name = name
        self.description = description

        string = '{}'.format(name)

        self.id = int(
            hashlib.sha256(string.encode('utf-8')).hexdigest(), 16) % 2**31

    @property
    def allowed_roles(self):
        roles = []
        for role in self.roles:
            roles.append(role.name)

        return roles


class RolePage(db.Model):
    __tablename__ = 'role_pages'
    id = db.Column(db.Integer(), db.Sequence(
        'role_pages_id_seq'), primary_key=True)
    role_id = db.Column(db.Integer(), db.ForeignKey(
        'roles.id', ondelete='CASCADE', onupdate='CASCADE'))
    page_id = db.Column(db.Integer(), db.ForeignKey(
        'pages.id', ondelete='CASCADE', onupdate='CASCADE'))

    __table_args__ = (db.UniqueConstraint('page_id', 'role_id', name='role_pages_uc'),)


class Role(db.Model):
    __tablename__ = 'roles'

    id = db.Column(
        db.Integer, primary_key=True)
    name = db.Column(db.String(16), nullable=False, unique=True)
    description = db.Column(db.String(64), nullable=True)

    pages = db.relationship('Page', secondary='role_pages', order_by='Page.id')

    NAMES = ['Admin', 'User']

    DESCRIPTIONS = \
        {
            'Admin': 'Administrator User',
            'User': 'Regular user'
        }

    def __repr__(self):
        """Generates a representation of this table

        Returns:
            string -- string showing the values of this table
        """
        return "<Categories(id={}, role='{}')>".format(self.id, self.name)

    def __init__(self, name, description=None):
        """Inserts a new row to the table categories

        Arguments:
            role {string} -- Role name

        Keyword Arguments:
            description {string} -- Category description
        """

        self.name = name

        if description:
            self.description = description
        else:
            if name in self.DESCRIPTIONS:
                self.description = self.DESCRIPTIONS[name]

        string = '{}'.format(name)

        self.id = int(
            hashlib.sha256(string.encode('utf-8')).hexdigest(), 16) % 2**31

    @property
    def allowed_pages(self):
        pages = []
        for page in self.pages:
            pages.append(page.name)

        return pages


class Language(db.Model):
    __tablename__ = 'languages'

    LANGUAGES = [
        {
            'name': 'Català',
            'iso_639_1': 'ca'
        },
        {
            'name': 'English',
            'iso_639_1': 'en'
        }
    ]

    id = db.Column(
        db.Integer, primary_key=True)
    name = db.Column(db.String(32), nullable=False, unique=True)
    iso_639_1 = db.Column(db.String(2), nullable=False, unique=True)

    def __init__(self, name: str = None, iso_639_1: str = None):
        self.name = name
        self.iso_639_1 = iso_639_1

        string = '{} {}'.format(name, iso_639_1)

        self.id = int(
            hashlib.sha256(string.encode('utf-8')).hexdigest(), 16) % 2**31


class User(db.Model, UserMixin):
    """Table users
    """

    __tablename__ = 'users'

    id = db.Column(
        db.Integer, primary_key=True)

    username = db.Column(db.String(16), nullable=False, unique=True)
    password = db.Column(db.String(64), nullable=False)
    name = db.Column(db.String(32), nullable=True)
    surname = db.Column(db.String(32), nullable=True)
    picture = db.Column(db.String(64), nullable=True)
    about = db.Column(db.String(256), nullable=True)
    email = db.Column(db.String(32), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    active = db.Column(db.Boolean)
    system = db.Column(db.Boolean)

    language_id = db.Column(db.BigInteger, db.ForeignKey('languages.id'), nullable=True)

    time_created = db.Column(
        db.DateTime(timezone=True), server_default=db.func.now())
    time_updated = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.now())

    roles = db.relationship('Role', secondary='user_roles', order_by='Role.id')

    configuration = db.relationship('UserConfiguration', cascade="all,delete")

    language = db.relationship('Language', foreign_keys=[language_id])

    session_data = {}

    def __repr__(self):
        """Generates a representation of this table

        Returns:
            string -- string showing the values of this table
        """
        return "<Users(name={}, surname={})>".format(self.name, self.name)

    def __init__(self, username, password='password', name=None,
                 surname=None, picture='/static/images/user.png', about=None,
                 email=None, phone=None, active=False, system=False, language_id=None):

        self.username = username
        self.password = bcrypt.encrypt(password)
        self.name = name
        self.surname = surname
        self.picture = picture
        self.about = about
        self.email = email
        self.phone = phone
        self.active = active
        self.system = system
        self.language_id = language_id

        string = '{}'.format(username)

        self.id = int(
            hashlib.sha256(string.encode('utf-8')).hexdigest(), 16) % 2**31

    def setPassword(self, new_password):
        self.password = bcrypt.encrypt(new_password)

    def is_authenticated(self):
        return True

    def is_active(self):
        return self.active

    def is_anonymous(self):
        return False

    def get_id(self):
        return self.id

    def valid_password(self, password):
        if self.active:
            return bcrypt.verify(password, self.password)    

        return False

    def mark_as_updated(self):
        self.time_updated = db.func.now()

    def get_update_time(self):
        if self.time_updated:
            return quote_plus(str(self.time_updated))
        else:
            return 'none'

    def has_page(self, page):
        if not isinstance(page, list):
            page = set([page])
        else:
            page = set(page)

        for role in self.roles:
            if any(role_page in page for role_page in role.allowed_pages):
                return True
        return False

    def has_role(self, role):
        if not isinstance(role, list):
            role = set([role])
        else:
            role = set(role)

        for my_role in self.roles:
            if my_role.name in role:
                return True
        return False

    def list_roles(self):
        list_of_roles = []
        for role in self.roles:
            list_of_roles.append(role.name)

        return list_of_roles


class UserRoles(db.Model):
    __tablename__ = 'user_roles'
    id = db.Column(db.Integer(), db.Sequence(
        'user_roles_id_seq'), primary_key=True)
    user_id = db.Column(db.Integer(), db.ForeignKey(
        'users.id', ondelete='CASCADE', onupdate='CASCADE'))
    role_id = db.Column(db.Integer(), db.ForeignKey(
        'roles.id', ondelete='CASCADE', onupdate='CASCADE'))

    __table_args__ = (db.UniqueConstraint('user_id', 'role_id', name='user_roles_uc'),)


class UserEmail(db.Model):
    __tablename__ = 'user_emails'
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer, db.ForeignKey(
            'users.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    user = db.relationship('User', uselist=False)

    # User email information
    email = db.Column(db.String(255), nullable=False, unique=True)
    email_confirmed_at = db.Column(db.DateTime())
    is_primary = db.Column(db.Boolean(), nullable=False, server_default='0')


class UserConfiguration(db.Model):
    """Table configuration

    This table is used to keep the application state after closing the session
    """

    __tablename__ = 'user_configuration'

    id = db.Column(db.Integer, db.ForeignKey('users.id', onupdate='CASCADE',
                   ondelete='CASCADE'), primary_key=True)
    key = db.Column(db.String(32), unique=True)
    value = db.Column(db.String(64))
    description = db.Column(db.String(64), nullable=True)

    def __init__(self, key, value, description=None):
        """Adds a new row to the configuration table

        Arguments:
            key {string} -- Configuration name
            value {db.String} -- Configuration value
        """

        self.key = key
        self.value = value
        self.description = description

    def __repr__(self):
        """Generates a representation of this table

        Returns:
            string -- string showing the values of this table
        """

        return "<UserConfiguration(id='{}', key='{}', value='{}')>".format(
            self.id, self.key, self.value)


class Configuration(db.Model):
    """Table configuration

    This table is used to keep the application state after closing the session
    """

    __tablename__ = 'configuration'

    id = db.Column(db.Integer, db.Sequence('config_id_seq'), primary_key=True)
    name = db.Column(db.String(32), unique=True)
    value = db.Column(db.String(256))
    description = db.Column(db.String(256), nullable=True)

    NAMES = []

    DESCRIPTIONS = \
        {

        }

    def __init__(self, name, value, description=None):
        """Adds a new row to the configuration table

        Arguments:
            key {string} -- Configuration name
            value {db.String} -- Configuration value
        """

        self.name = name
        self.value = value

        if description:
            self.description = description
        else:
            if name in self.DESCRIPTIONS:
                self.description = self.DESCRIPTIONS[name]

    def __repr__(self):
        """Generates a representation of this table

        Returns:
            string -- string showing the values of this table
        """

        return "<Configuration(id='{}', name='{}', value='{}')>".format(
            self.id, self.name, self.value)

