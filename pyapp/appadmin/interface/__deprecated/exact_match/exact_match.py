import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../"))

from flask import Blueprint, render_template, request, redirect, url_for, Response, send_from_directory, jsonify
from flask_login import current_user, LoginManager
from flask_login import login_required
from werkzeug.utils import secure_filename

from models.ac_interface import dbi, User, Role, AnnotationDatabase, Configuration
from models.ac_annotations import AnnotationSource, Image
from interface.base.base import login_manager
from tools.db_manager import DBManagerAnnotation, DBManagerCombined

import json
import time

from utils.blueprint_utils import roles_required_online, setup_blueprint, dbrm


blp = Blueprint(
    'exact_match_blueprint',
    __name__,
    url_prefix='/exact_match',
    template_folder='templates'
)

setup_blueprint(blp, __name__)

@blp.route('/wrong_annotations', methods=['GET', 'POST'])
@roles_required_online(blp)
def wrong_annotations():
    state = None
    message = None

    assigned_db_users = current_user.annotation_platform_users

    jobs = dbrm.find_jobs_by_users(assigned_db_users)
    jobs = list(set(jobs) - set([x for x in range(1030, 1060, 1)]))

    current_user.session_data['jobs'] = jobs

    job_data = None
    if jobs:
        job_data = dbrm.num_wrong_annotations_per_job_ids(jobs)

    return render_template('exact_match_wrong_annotations.html', **locals())

@blp.route('/<job_id>', methods=['GET', 'POST'])
@roles_required_online(blp)
def show_job(job_id):
    if not current_user.session_data['jobs'] or int(job_id) not in current_user.session_data['jobs']:
        return render_template('errors/page_404.html'), 404

    return render_template('exact_match_show_images_by_job.html', **locals())
    

@blp.route('/communicate', methods=['GET', 'POST'])
@roles_required_online(blp)
def communicate():
    message = None
    response = None

    try:
        if request.method == 'POST':
            json_data = json.loads(request.data.decode('utf-8'))

            if json_data['request'] == 'get_wrong_images_for_job':
                response = dbrm.get_wrong_images_by_job_id(
                    int(json_data['id']), offset=int(json_data['offset']),
                    limit=int(json_data['limit']))

                #message = '{} wrong annotated images for job {} loaded correctly'.format(
                #    len(response), json_data['id'])
                message = None

            if json_data['request'] == 'get_annotations_by_image_id':
                image_id = json_data['image_id']
                assigned_db_users = current_user.annotation_platform_users

                response = dbrm.get_annotations_by_image_id_and_user_ids(
                    image_id, assigned_db_users)

                #message = 'Annotations for image {}, loaded correctly'.format(image_id)
                message = None

            if json_data['request'] == 'update_annotations':
                users = json_data['users']
                urls = json_data['urls']

                # Do stuff
                for user in users:
                    dbrm.insert_annotation(user_id=user['user_id'],
                                                      image_id=user['image_id'],
                                                      similar_urls=urls,
                                                      prev_annotation_id=user['annotation_id'])
                message = 'Annotations updated correctly'

            return Response(json.dumps({'message': message, 'request': response}),
                            status=200)
    except Exception as e:
        error_msg = '{}'.format(e)
        print(error_msg)
        return Response(error_msg, status=500)

    return Response(json.dumps({'message': message, 'request': response}), status=200)


@login_manager.unauthorized_handler
def unauthorized_handler():
    return render_template('errors/page_403.html'), 403


@blp.errorhandler(403)
def access_forbidden(error):
    return render_template('errors/page_403.html'), 403


@blp.errorhandler(404)
def not_found_error(error):
    return render_template('errors/page_404.html'), 404


@blp.errorhandler(500)
def internal_error(error):
    return render_template('errors/page_500.html'), 500
