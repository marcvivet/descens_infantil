import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../"))

from flask import Blueprint, render_template, request, Response, send_from_directory, jsonify

from models.interface_model import Configuration

from utils.blueprint_utils import roles_required_online, config

import json

#from threading import Thread, Event
from eventlet.green.threading import Thread, Event
from eventlet.green.subprocess import Popen, PIPE
from random import random
from time import sleep
#from subprocess import Popen, PIPE
from queue import Queue, Empty
import eventlet


blp = Blueprint(
    'databases',
    __name__,
    url_prefix='/databases',
    template_folder='templates',
    static_folder='static',
    static_url_path='/static'
)

# --------------------------------------------------


thread = Thread()
thread_stop_event = Event()


@blp.route('/main_test')
def index():
    #only by sending this page first will the client be connected to the socketio instance
    return render_template('database_test.html')


class ScrapingThread(Thread):
    def __init__(self):
        self.delay = 0.5
        super(ScrapingThread, self).__init__()

    def scrapingOutput(self):
        """
        Generate a random number every 1 second and emit to a socketio instance (broadcast)
        Ideally to be run in a separate thread?
        """
        proc = Popen([
            'python3', os.path.join(ROOT_FILE_PATH, 'test_process.py')],
            stdout=PIPE, stderr=PIPE, bufsize=1)

        while not thread_stop_event.isSet():
            retcode = proc.poll()
            if retcode is not None: # Process finished.
                print('Exist thread')
                break

            for bin_line in proc.stdout:
                line = bin_line.decode('ascii')[:-1]
                sys.stdout.write(line)
                sys.stdout.flush()
                socketio.emit('scraping_output', json.dumps({'output': line}), namespace='/test')
            sleep(self.delay)

    def run(self):
        self.scrapingOutput()







































blp.databases_add = {'method': None, 'uploaded': []}
blp.test_db_managers = []

@blp.route('/view', methods=['GET', 'POST'])
@roles_required_online(blp)
def view():
    dbim = blp.db_manager

    state = None
    message = None

    page_type = 'databases'
    page_title = 'Edit Database'

    if request.method == 'POST':
        try:
            data = request.form
            database = dbim.query(ScrapingDatabase).get(
                int(data['database_id']))

            if 'action' in data:
                if data['action'] == 'edit':
                    return render_template('database_edit.html', **locals())

                if data['action'] == 'update_database':
                    message = "Could not update database {}".format(database.name)
                    dbim.commit()

                    message = "Database {} updated correctly".format(database.name)

                if data['action'] == 'delete':
                    message = "Could not delete database {}".format(database.name)

                    database.close()
                    dbim.delete(database)
                    dbim.commit()

                    os.remove(
                        os.path.join(
                            config['AC_ROOT_DATABASE_PATH'],
                            '{}.sqlite'.format(database.name)))

                    message = "Database {} deleted correctly".format(database.name)
                
            state = 'success'
        except Exception as e:
            dbim.rollback()
            error_msg = 'Exception: {}'.format(e)
            print(error_msg)
            state = 'error'
            message = 'An error occurred. {}'.format(error_msg)

    databases = dbim.query(ScrapingDatabase).all()
    num_databases = len(databases)

    return render_template('database_view.html', **locals())


@blp.route('/download/<path:filename>', methods=['GET', 'POST'])
@roles_required_online(blp)
def download(filename):
    return send_from_directory(directory=config['AC_ROOT_DATABASE_PATH'], filename=filename)


@blp.route('/add', methods=['GET', 'POST'])
@roles_required_online(blp)
def add():
    dbim = blp.db_manager

    state = None
    message = None

    if request.method == 'POST':
        try:
            state = 'success'
        except Exception as e:
            dbim.rollback()
            error_msg = 'Exception: {}'.format(e)
            print(error_msg)
            state = 'error'
            message = 'An error occurred while trying to edit an user. {}'.format(error_msg)

    databases = ScrapingDatabase.query.all()
    return render_template('database_add.html', **locals())


@blp.route('/upload', methods=['GET', 'POST'])
@roles_required_online(blp)
def upload():
    dbim = blp.db_manager

    try:
        if request.method == 'POST':
            anndbs_names = []
            anndbs = ScrapingDatabase.query.all()
            for anndb in anndbs:
                anndbs_names.append(anndb.name)

            for f in request.files.getlist('file'):
                only_name, file_extension = os.path.splitext(f.filename)

                if only_name not in anndbs_names and f.filename not in blp.databases_add['uploaded']:
                    f.save(os.path.join(
                        config['UPLOAD_FOLDER'], 'databases/{}'.format(f.filename)))
                    blp.databases_add['uploaded'].append(f.filename)
                else:
                    raise Exception('There is annother database with the same name.')
    except Exception as e:
            dbim.rollback()
            error_msg = '{}'.format(e)
            print(error_msg)

            return Response(error_msg, status=500)
    return Response("OK", status=200)


@blp.route('/communicate', methods=['GET', 'POST'])
@roles_required_online(blp)
def communicate():
    dbim = blp.db_manager
    message = None
    try:
        if request.method == 'POST':
            json_data = json.loads(request.data.decode('utf-8'), encoding='utf8')

            if 'method' in json_data:
                blp.databases_add = {'method': json_data['method'], 'uploaded': []}

            if 'remove' in json_data:
                blp.databases_add['uploaded'].remove(json_data['remove'])
                os.remove(os.path.join(
                    config['UPLOAD_FOLDER'], 'databases/{}'.format(json_data['remove'])))
                message = 'Database {} removed'.format(json_data['remove'])

            if 'request' in json_data:
                response = None

                if json_data['request'] == 'check_form_method2':
                    try:
                        database_type = 'mySQL'
                        data_base_name = json_data['data_base_name']
                        host = json_data['host']
                        user = json_data['user']
                        password = json_data['password']     

                        for manager in blp.test_db_managers:
                            if manager:
                                if manager.session:
                                    manager.close()
                                else:
                                    manager.session = None
                                    manager.engine = None

                        db_managers = [DBManagerScraping(
                            data_base_name=data_base_name,
                            data_base_type=database_type,
                            user=user,
                            password=password,
                            host=host)]

                        blp.test_db_managers = db_managers
                    except Exception as e:
                        error_msg = 'Can not connect to mySQL with the given parameters! {}'.format(e)
                        return Response(json.dumps({'message': error_msg}), status=500)

                    return Response(json.dumps({'message': 'success'}), status=200)

                if json_data['request'] == 'table_data':
                    databases = []

                    if blp.databases_add['method'] == 1:
                        database_type = 'SQLite'    
                        db_managers = []

                        for manager in blp.test_db_managers:
                            if manager:
                                if manager.session:
                                    manager.close()
                                else:
                                    manager.session = None
                                    manager.engine = None

                        
                        for id, name in enumerate(blp.databases_add['uploaded']):
                            only_name, _ = os.path.splitext(name)
                            databases.append({'name': only_name, 'type': database_type, 'id': id})
                            db_managers.append(
                                DBManagerScraping(
                                    data_base_name=only_name,
                                    data_base_path=os.path.join(
                                        config['UPLOAD_FOLDER'], 'databases/{}'.format(name))))

                            blp.test_db_managers = db_managers
                    else:
                        database_type = 'mySQL'
                        databases.append({'name': blp.test_db_managers[0].data_base_name, 'type': database_type, 'id': 0})

                    integrity_test = blp.test_db_managers[0].get_integrity_tests()

                    response = \
                        {
                            'databases': databases,
                            'integrity_tests': integrity_test
                        }

                if json_data['request'] == 'perform_test':
                    result = blp.test_db_managers[
                        json_data['id']].check_model_integrity(
                            json_data['model'])

                    if not result:
                        response = \
                            {
                                'result': 'success',
                                'info': None
                            }
                    else:
                        response = \
                            {
                                'result': 'fail',
                                'info': result
                            }

                if json_data['request'] == 'finish':
                    dataset_path = ''
                    
                    for id in json_data['data']:
                        adb = blp.test_db_managers[id]

                        new_path = None

                        if adb.data_base_type == 'SQLite':
                            new_path = os.path.join(
                                config['AC_ROOT_DATABASE_PATH'],
                                '{}.sqlite'.format(adb.data_base_name))

                            os.rename(adb.data_base_path, new_path)

                        dbim.import_scraping_database(adb, new_path)

                    for manager in blp.test_db_managers:
                        if manager:
                            if manager.session:
                                manager.close()
                            else:
                                manager.session = None
                                manager.engine = None

                    blp.test_db_managers = []

                    dbim.commit()
                    dbim.get_db_names(force=True)
                    response = 'OK'
                    message = 'Databases added correctly!'

                if json_data['request'] == 'get_scraping_databases':
                    databases = blp.db_manager.get_scraping_databases()
                    response = [{
                        'id': str(data['id']),
                        'name': data['name'],
                        'date': data['date']} for data in databases]

                return Response(json.dumps({'message': message, 'request': response}),
                                status=200)
    except Exception as e:
        dbim.rollback()
        error_msg = '{}'.format(e)
        print(error_msg)

        return Response(error_msg, status=500)

    return Response(json.dumps({'message': message}), status=200)


@blp.errorhandler(403)
def access_forbidden(error):
    return render_template('errors/page_403.html'), 403


@blp.errorhandler(404)
def not_found_error(error):
    return render_template('errors/page_404.html'), 404


@blp.errorhandler(500)
def internal_error(error):
    return render_template('errors/page_500.html'), 500
