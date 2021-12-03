import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../"))

from flask import Blueprint, render_template, request, Response
from flask_login import login_required

from models.interface_model import Role, Page

from utils.blueprint_utils import roles_required_online, config

import json

blp = Blueprint(
    'movies',
    __name__,
    url_prefix='/movies',
    template_folder='templates',
    static_folder='static',
    static_url_path='/static'
)

@blp.route('/search', methods=['GET', 'POST'])
@roles_required_online(blp)
def movies_search():
    return render_template('movies_search.html', **locals())

@blp.route('/download', methods=['GET', 'POST'])
@roles_required_online(blp)
def movies_download():
    return render_template('movies_download.html', **locals())

@blp.route('/communicate', methods=['GET', 'POST'])
@roles_required_online(blp)
def communicate():
    message = None
    response = None

    try:
        if request.method == 'POST':
            json_data = json.loads(request.data.decode('utf-8'))

            if json_data['request'] == 'search_movie':
                tmdb = TMDBManager()

                response = tmdb.search_movie(json_data['movie_title'])

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


@blp.errorhandler(403)
def access_forbidden(error):
    return render_template('errors/page_403.html'), 403


@blp.errorhandler(404)
def not_found_error(error):
    return render_template('errors/page_404.html'), 404


@blp.errorhandler(500)
def internal_error(error):
    return render_template('errors/page_500.html'), 500
