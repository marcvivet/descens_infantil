import sys
import os
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../"))

from flask import Blueprint, render_template, request, Response
from flask_login import login_required

from models.interface_model import Role, Page
from flask_login import current_user
from utils.blueprint_utils import roles_required_online, config

import json


blp = Blueprint(
    'scraping',
    __name__,
    url_prefix='/scraping',
    template_folder='templates',
    static_folder='static',
    static_url_path='/static'
)


@blp.route('/view', methods=['GET', 'POST'])
@roles_required_online(blp)
def movies_view():
    return render_template('scraping_view.html', **locals())

@blp.route('/open_link', methods=['GET'])
@roles_required_online(blp)
def open_link():
    if 'movie_id' in request.args:
        movie_id = request.args['movie_id']
    else:
        return not_found_error('Incorrect input')

    if 'thread_id' in request.args:
        thread_id = request.args['thread_id']
    else:
        return not_found_error('Incorrect input')

    if 'link' in request.args:
        link = request.args['link']
    else:
        return not_found_error('Incorrect input')

    db = blp.db_manager

    movie_user_in_db = db.query(
        MovieUser).filter(MovieUser.movie_id == movie_id).filter(
            MovieUser.user_id == current_user.id).first()
    if movie_user_in_db:
        if not movie_user_in_db.visited:
            movie_user_in_db.visited = datetime.now()
            db.commit()
    else:
        movie_user = MovieUser(movie_id, current_user.id, visited=datetime.now())
        db.add(movie_user)
        db.commit()

    user_thread_in_db = db.query(
        UserThread).filter(UserThread.thread_id == thread_id).filter(
            UserThread.user_id == current_user.id).first()

    if user_thread_in_db:
        if not user_thread_in_db.visited:
            user_thread_in_db.visited = datetime.now()
            db.commit()
    else:
        user_thread = UserThread(current_user.id, thread_id, visited=datetime.now())
        db.add(user_thread)
        db.commit()

    return render_template('scraping_open_link.html', **locals())


@blp.route('/communicate', methods=['GET', 'POST'])
@roles_required_online(blp)
def communicate():
    message = None
    response = None
    db = blp.db_manager

    try:
        if request.method == 'POST':
            json_data = json.loads(request.data.decode('utf-8'), encoding='utf8')

            if json_data['request'] == 'get_threads':
                select_year = json_data['select_year']
                page = json_data['page']
                limit = json_data['limit']
                offset = json_data['offset']

                response = db.get_threads(select_year=select_year, page=page, limit=limit, offset=offset)

                #response = []
                #for db_id, data in response_all.items():
                #    response.extend(data)

                #response = sorted(response, key=lambda k: k['last_thread_date'], reverse=True)
                #message = 'Loaded some {} movies'.format(len(response))
                #message = None

            if json_data['request'] == 'get_years':
                response = db.get_movie_years()
                response = sorted(response.keys(), reverse=True)

            if json_data['request'] == 'mark_as_visited':
                movie_id = json_data['id']

                movie_user_in_db = db.query(
                    MovieUser).filter(MovieUser.movie_id == movie_id).filter(
                        MovieUser.user_id == current_user.id).first()
                if movie_user_in_db:
                    if not movie_user_in_db.visited:
                        movie_user_in_db.visited = datetime.now()
                        db.commit()
                else:
                    movie_user = MovieUser(movie_id, current_user.id, visited=datetime.now())
                    db.add(movie_user)
                    db.commit()

            if json_data['request'] == 'delete_movie':
                movie_id = json_data['id']
               
                movie_user_in_db = db.query(
                    MovieUser).filter(MovieUser.movie_id == movie_id).filter(
                        MovieUser.user_id == current_user.id).first()
                if movie_user_in_db:
                    if not movie_user_in_db.hide:
                        movie_user_in_db.hide = datetime.now()
                        db.commit()
                else:
                    movie_user = MovieUser(movie_id, current_user.id, hide=datetime.now())
                    db.add(movie_user)
                    db.commit()

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
