import os

import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from models.interface_model import Page, Role, User

LOG = logging.getLogger(__name__)


class DBManagerError(Exception):
    """Custom Exception for Augmenters."""

    def __init__(self, message):
        """Create a new exception.

        Arguments:
            message (str): Exception description

        """
        super(DBManagerError, self).__init__(message)
        LOG.info(message)


def manage_sql_exceptions(func):
    def wrap(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as inst:
            args[0].session.rollback()
            raise       
    return wrap


class NamedSingleton(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = {}

        data_base_name = kwargs.get('data_base_name', 'descens_infantil')

        if data_base_name not in cls._instances[cls]:
            cls._instances[cls][data_base_name] = \
                super(NamedSingleton, cls).__call__(*args, **kwargs)
        elif not cls._instances[cls][data_base_name].engine:
            cls._instances[cls][data_base_name] = \
                super(NamedSingleton, cls).__call__(*args, **kwargs)

        return cls._instances[cls][data_base_name]


class DBManager(metaclass=NamedSingleton):
    """Performs the connection and interaction to the data base
    """

    def __init__(self, data_base_name='descens_infantil', data_base_type='SQLite',
                 user='admin', password='12345', host='localhost', clean=False,
                 data_base_path=None):
        """Creates a new connection to the database

        Keyword Arguments:
            data_base_name {string} -- Data base name (default: {scraping_corrector})
            data_base_type {string} -- Type of data base it could be mySQL or SQLite
                                       (default: {SQLite})
            user {string} -- User name used by mySQL (default: {scraping_corrector})
            password {string} -- Password used by mySQL (default: {password})
            clean {bool} -- Empties the database (default: {False})

        Raises:
            Exception -- Not implemented
        """
        self.data_base_name = data_base_name
        self.data_base_type = data_base_type
        self.data_base_user = user
        self.data_base_password = password
        self.data_base_host = host
        self.data_base_local_path = None
        self.data_base_path = data_base_path

        self.config = None

        self.connect(clean=clean)

    def connect(self, clean=False):
        if self.data_base_type == 'SQLite':
            print('Using SQLite')

            if not self.data_base_path:
                tmp_dir = os.path.join(os.path.dirname(
                    os.path.dirname(
                        os.path.dirname(
                            os.path.abspath(__file__)))), 'data/databases/')

                if not os.path.isdir(tmp_dir):
                    os.makedirs(tmp_dir)

                self.data_base_path = os.path.join(
                    tmp_dir, '{}.sqlite'.format(self.data_base_name))

            if clean:
                if os.path.exists(self.data_base_path):
                    os.remove(self.data_base_path)

            print('Data Base Path: {}'.format(self.data_base_path))

            self.data_base_local_path = 'sqlite:///{}'.format(
                self.data_base_path)

            self.engine = create_engine(
                self.data_base_local_path, echo=False,
                connect_args={'check_same_thread': False},
                poolclass=StaticPool)

            session = sessionmaker(bind=self.engine)
            self.session = session()
        elif self.data_base_type == 'mySQL':
            print('Using mySQL')

            self.data_base_local_path = \
                'mysql+mysqldb://{}:{}@{}/{}'.format(
                    self.data_base_user, self.data_base_password,
                    self.data_base_host, self.data_base_name)
            self.engine = create_engine(
                self.data_base_local_path,
                echo=False)

            self.engine.connect()

            session = sessionmaker(bind=self.engine)
            self.session = session()

            if clean:
                sql_sentence = \
                    'DROP DATABASE {}'.format(self.data_base_name)

                self.session.execute(sql_sentence)
                self.session.commit()

                sql_sentence = \
                    'CREATE DATABASE {}'.format(self.data_base_name)

                self.session.execute(sql_sentence)
                self.session.commit()

                sql_sentence = \
                    'USE {}'.format(self.data_base_name)

                self.session.execute(sql_sentence)
                self.session.commit()
        else:
            raise Exception('Not implemented for database: {}'.format(
                data_base_type))
        self.commit()

    def get_integrity_tests(self):
        return list(self.models.keys())

    def check_model_integrity(self, model):
        try:
            self.session.query(self.models[model]).first()
            return None
        except Exception as e:
            return \
                'Problems with model {}, table {},{}'.format(
                    model, self.models[model].__table__.name,
                    str(e).split('[')[0].split(')')[-1])

    def check_integrity(self):
        problems = []
        for key, model in self.models.items():
            try:
                self.session.query(model).first()
            except Exception as e:
                problems.append(
                    'Problems with model {}, table {},{}'.format(
                        key, model.__table__.name,
                        str(e).split('[')[0].split(')')[-1]))

        return problems

    def close(self):
        self.session.close()
        self.engine.dispose()
        
        self.session = None
        self.engine = None

    def create_all(self, base):
        base.metadata.create_all(self.engine)

    def is_alive(self):
        try:
            self.session.execute('SELECT 1 AS is_alive;')
            return True
        except:
            return False

    @manage_sql_exceptions
    def execute(self, command):
        return self.session.execute(command)

    @manage_sql_exceptions
    def add(self, element):
        """Adds a new row to a table

        Arguments:
            element {object} -- table object
        """
        self.session.add(element)
        self.session.flush()

    @manage_sql_exceptions
    def commit(self):
        """Adds persistend changes to the data base which can not be rolled back
        """
        self.session.commit()

    @manage_sql_exceptions
    def delete(self, element):
        """Deletes an element

        Arguments:
            element {object} -- table object
        """
        self.session.delete(element)

    @manage_sql_exceptions
    def rollback(self):
        """Undo the changes if something when wrong
        """
        self.session.rollback()

    @manage_sql_exceptions
    def flush(self):
        """Adds changes to the database but they can be rolled back
        """
        self.session.flush()

    @manage_sql_exceptions
    def query(self, element):
        return self.session.query(element)

    def get_config(self, force=False):
        """Returns a dictionary with the key as the configuration key and value as its value.

        Returns:
            Dictionray -- With key as the configuration key and value as its value.
        """

        if not self.config or force:
            self.config = {}

            result = self.execute(
                'SELECT configuration.key, configuration.value '
                'FROM configuration').fetchall()

            for row in result:
                self.config[row['key']] = row['value']

        return self.config

    def get_roles(self):
        return self.query(Role).all()

    def get_role_by_id(self, role_id):
        return self.query(Role).filter_by(id=role_id).first()

    def delete_role_by_id(self, role_id):
        role = self.query(Role).filter_by(id=role_id).one()
        name = role.name
        self.delete(role)
        return name

    def get_pages(self):
        return self.query(Page).all()

    def get_page_by_name(self, page_name):
        return self.query(Page).filter_by(name=page_name).first()

    def add_page(self, name, description=None, default_role='Admin'):
        page = Page(name, description=description)

        if default_role:
            admin = self.query(Role).filter_by(name=default_role).one()
            page.roles.append(admin)

        self.add(page)
        self.commit()

        return page
