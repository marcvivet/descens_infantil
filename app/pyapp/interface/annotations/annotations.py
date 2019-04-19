import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../"))

import json

from flask import Blueprint, render_template, request, Response, redirect, url_for
from flask_login import current_user
from models.ac_annotations import dba, Annotation, SelectedProposal, \
    BoundingBoxProposal, CategoryProposal

from interface.base.base import unauthorized_handler
from tools.db_manager import DBManagerAnnotation, DBManagerCombined

from utils.blueprint_utils import roles_required_online, setup_blueprint, dbim

from collections import OrderedDict

blp = Blueprint(
    'annotations_blueprint',
    __name__,
    url_prefix='/annotations',
    template_folder='templates'
)

setup_blueprint(blp, __name__)

def remove_duplicates_in_category_proposals(elements):
    result = []
    added_names = []

    for element in elements:
        if element.category.name not in added_names:
            result.append(
                {
                    'id': element.id,
                    'name': element.category.name
                })
            added_names.append(element.category.name)

    return result


@blp.route('/correct_selector')
@roles_required_online(blp)
def correct_selector():
    if 'state' in request.args:
        state = request.args['state']
    else:
        state = None

    if 'message' in request.args:
        message = request.args['message']
    else:
        message = None

    if 'category' in request.args:
        category = request.args['category']
    else:
        category = 'Not Set'

    type = 'correct'

    db_combined = DBManagerCombined(current_user)
    category_dict = db_combined.get_categories(only_one=True)

    sum_user = 0
    sum_total = 0
    if category_dict:
        remaining = db_combined.get_remaining_annotations_to_validate_per_category(
            user_id=current_user.id, sum_result=True)

        for _, count in remaining['user'].items():
            sum_user += count

        for _, count in remaining['total'].items():
            sum_total += count

    return render_template(
        'annotation_selector.html', **locals())


@blp.route('/revise_selector')
@roles_required_online(blp)
def revise_selector():
    if 'state' in request.args:
        state = request.args['state']
    else:
        state = None

    if 'message' in request.args:
        message = request.args['message']
    else:
        message = None

    if 'category' in request.args:
        category = request.args['category']
    else:
        category = 'Not Set'

    if 'page' in request.args:
        page = request.args['page']
    else:
        page = 1

    type = 'revise'
    images_per_page = 50

    db_combined = DBManagerCombined(current_user)
    category_dict = db_combined.get_categories(only_one=True)

    sum_user = 0
    sum_total = 0

    if category_dict:
        remaining = db_combined.get_remaining_annotations_to_validate_per_category(
            user_id=current_user.id, sum_result=True)

        for _, count in remaining['user'].items():
            sum_user += count

        for _, count in remaining['total'].items():
            sum_total += count

    return render_template(
        'annotation_selector.html', **locals())

@blp.route('/progress')
@roles_required_online(blp)
def progress():
    
    db_combined = DBManagerCombined(current_user)
    category_dict = db_combined.get_categories(only_one=True)

    sum_user = 0
    sum_total = 0

    if category_dict:
        remaining_dict = db_combined.get_remaining_annotations_to_validate_per_category(
            user_id=current_user.id)

        annotations_per_day_dict = db_combined.get_annotations_per_day(
            user_id=current_user.id)

        remaining = {'user': {}, 'total': {}}
        for k0, val0 in remaining_dict.items():
            for k1, val1 in val0.items():
                for k2, val2 in val1.items():
                    if k2 not in remaining[k1]:
                        remaining[k1][k2] = val2
                    else:
                        remaining[k1][k2] += val2
                
        annotations_per_day_ = {}
        for k, vallist in annotations_per_day_dict.items():
            for val in vallist:
                if val[1] not in annotations_per_day_:
                    annotations_per_day_[val[1]] = val[0]
                else:
                    annotations_per_day_[val[1]] += val[0]

        annotations_per_day = OrderedDict(sorted(annotations_per_day_.items()))
                
        sum_user = 0
        for _, count in remaining['user'].items():
            sum_user += count

        sum_total = 0
        for _, count in remaining['total'].items():
            sum_total += count

    return render_template(
        'annotation_progress.html', **locals())


def get_bbox_indx(bounding_box_proposals, bbox_id):
    for idx, bbox in enumerate(bounding_box_proposals):
        if bbox_id == bounding_box_proposals.id:
            return idx
    
    return -1

@blp.route('/gallery', methods=['GET', 'POST'])
@roles_required_online(blp)
def gallery():
    if 'state' in request.args:
        state = request.args['state']
    else:
        state = None

    if 'message' in request.args:
        message = request.args['message']
    else:
        message = None

    if 'category' in request.args:
        category = request.args['category']
    else:
        return unauthorized_handler()

    if 'page' in request.args:
        page = int(request.args['page'])
    else:
        page = 1

    if 'max_pages' in request.args:
        max_pages = int(request.args['max_pages'])
    else:
        max_pages = None

    if 'type' in request.args:
        type = request.args['type']

        if type == 'revise':
            page_title = 'Revise Annotations'
            go_back_url = 'revise_selector'

        elif type == 'correct':
            page_title = 'Correct Annotations'
            go_back_url = 'correct_selector'

        else:
            return unauthorized_handler()
    else:

        return unauthorized_handler()

    db_names = dbim.get_db_names()
    db_combined = DBManagerCombined(current_user)
    states = db_combined.get_proposal_states(only_one=True)
    categories = db_combined.get_categories(only_one=True)

    if request.method == 'POST':
        json_data = json.loads(request.data.decode('utf-8'), encoding='utf8')

        try:
            for id_str, data in json_data.items():
                split_id_str = id_str.split('_')

                id_db = int(split_id_str[0])
                id_annotation = int(split_id_str[1])
                id_source = db_combined.get_source(id_db)
                db_manager = db_combined.get_manager(id_db)

                if type == 'correct':
                    selProposal = SelectedProposal(id_annotation, id_source, None, None,
                                                   states['Ok'])
                else:
                    selProposal = db_manager.query(SelectedProposal).filter(
                        SelectedProposal.id_annotation == id_annotation).filter(
                            SelectedProposal.id_annotation_source == id_source).one()

                    selProposal.id_state = states['Ok']

                if data['state_info']['deleted']:
                    selProposal.id_state = states['Delete']

                    if type == 'correct':
                        if selProposal.category:
                            if selProposal.category.id_annotation_source == id_source:
                                db_manager.session.delete(selProposal.category)

                        if selProposal.bbox:
                            if selProposal.bbox.id_annotation_source == id_source:
                                db_manager.session.delete(selProposal.bbox)

                    db_manager.session.add(selProposal)
                    db_manager.session.flush()
                    db_manager.session.commit()
                    continue

                if data['bbox_info']['selected'] == -1:
                    bbox = data['bbox_info']['bbox']
                    bbox_proposal = BoundingBoxProposal(
                        id_annotation, id_source, bbox[0], bbox[1], bbox[2], bbox[3])
                    db_manager.session.add(bbox_proposal)
                    db_manager.session.flush()

                    if type == 'correct':
                        if selProposal.bbox:
                            if selProposal.bbox.id_annotation_source == id_source:
                                db_manager.session.delete(selProposal.bbox)

                    selProposal.id_bbox = bbox_proposal.id
                else:
                    sel_bbox = data['bbox_info']['selected']

                    if type == 'correct':
                        if selProposal.bbox:
                            if selProposal.bbox.id_annotation_source == id_source:
                                db_manager.session.delete(selProposal.bbox)

                    selProposal.id_bbox = data['bbox_info']['proposals_ids'][sel_bbox]

                if data['category_info']['selected'] == -1:
                    new_category = data['category_info']['category']

                    if not new_category:
                        raise Exception('At least on image in this page do not have any category selected!')

                    category_proposal = CategoryProposal(
                        id_annotation, id_source, categories[new_category])
                    db_manager.session.add(category_proposal)
                    db_manager.session.flush()

                    if type == 'correct':
                        if selProposal.category:
                            if selProposal.category.id_annotation_source == id_source:
                                db_manager.session.delete(selProposal.category)

                    selProposal.id_category = category_proposal.id
                else:
                    sel_category = data['category_info']['selected']

                    if type == 'correct':
                        if selProposal.category:
                            if selProposal.category.id_annotation_source == id_source:
                                db_manager.session.delete(selProposal.category)

                    selProposal.id_category = data['category_info']['proposals_ids'][sel_category]

                if type == 'correct':
                    db_manager.session.add(selProposal)

                db_manager.session.flush()
                db_manager.session.commit()

            state = 'success'
            message = 'Data Base updated successfully'
        except Exception as e:
            db_manager.session.rollback()
            error_msg = 'Exception: {}'.format(e)
            print(error_msg)
            state = 'error'
            message = 'An error occurred while trying to update the database. {}'.format(error_msg)
            return Response(json.dumps({'state': state, 'message': message}), status=0)

        if type == 'correct':
            return Response(json.dumps({'url': '/annotations/gallery?type={}&category={}&state={}&message={}'.format(type, category, state, message)}), status=200)
        else:
            if page + 1 > max_pages:
                return Response(
                    json.dumps(
                        {'url': '/annotations/revise_selector?category={}&state={}&message={}&page={}'.
                            format(category, state, message, page + 1,)}), status=200)

            return Response(
                json.dumps(
                    {'url': '/annotations/gallery?type={}&category={}&state={}&message={}&page={}'
                            '&max_pages={}'.format(type, category, state, message, page + 1,
                                                   max_pages)}), status=200)

    if type == 'correct':
        dict_of_ids = db_combined.get_remaining_annotations_ids_for_category(
            category, user_id=current_user.id, limit=50)
    else:
        dict_of_ids = db_combined.get_revised_annotations_ids_for_category(
            category, user_id=current_user.id, limit=50, page=page)

        sel_proposal_dict = {}
        for db_id, list_of_ids in dict_of_ids.items():
            selected_proposals =\
                db_combined.get_manager(db_id).query(SelectedProposal).filter(
                    SelectedProposal.id_annotation.in_(list_of_ids)).filter(
                        SelectedProposal.id_annotation_source == db_combined.get_source(
                            db_id)).all()

            sel_proposal_dict[db_id] = {}
            for element in selected_proposals:
                sel_proposal_dict[db_id][element.id_annotation] = element

    all_results = 0
    for key, val in dict_of_ids.items():
        all_results += len(val)

    if all_results:
        annotations = {}
        for db_id, list_of_ids in dict_of_ids.items():
            annotations[db_id] = db_combined.get_manager(
                db_id).query(Annotation).filter(Annotation.id.in_(list_of_ids)).all()

        return render_template(
            'annotation_gallery.html', **locals(), max=max, min=min, enumerate=enumerate, len=len,
            remove_duplicates_in_category_proposals=remove_duplicates_in_category_proposals,
            get_bbox_indx=get_bbox_indx)
    else:
        if type == 'correct':
            return redirect(
                url_for('annotations_blueprint.correct_selector',
                        state=state, message=message, category=category))
        else:
            return redirect(
                url_for('annotations_blueprint.revise_selector',
                        state=state, message=message, category=category, page=page))


@blp.route('/communicate', methods=['GET', 'POST'])
@roles_required_online(blp)
def communicate():
    message = None
    try:
        if request.method == 'POST':
            json_data = json.loads(request.data.decode('utf-8'), encoding='utf8')

            db_combined = DBManagerCombined(current_user)
            if json_data['request'] == 'clusters':
                id_temp = json_data['id'].split('_')
                id_db = int(id_temp[0])
                id_annotation = int(id_temp[1])
                db_manager = db_combined.get_manager(id_db)

                bbox_proposal = db_manager.session.query(
                    BoundingBoxProposal).filter(
                        BoundingBoxProposal.id_annotation == id_annotation).filter(
                            BoundingBoxProposal.id_annotation_source == 0).first()

                if not bbox_proposal:
                    bbox_proposal = db_manager.session.query(
                        BoundingBoxProposal).filter(
                            BoundingBoxProposal.id_annotation == id_annotation).filter(
                                BoundingBoxProposal.id_annotation_source == 1).first()

                clusters = []
                bbox_proposals = []
                color_counter = 1
                if bbox_proposal:                  
                    clusters = db_manager.get_bbox_proposal_clusters(bbox_proposal.id)
                    bbox_proposals = db_manager.get_annotation_bbox_proposals(id_annotation)
                    
                    for bbox_data in bbox_proposals:
                        bbox_data['color_id'] = color_counter
                        color_counter += 1

                    for cluster in clusters:
                        cluster['color_id'] = color_counter
                        color_counter += 1

                        for cat_data in cluster['categories']:
                            cat_data['color_id'] = color_counter
                            color_counter += 1

                return Response(json.dumps(
                    {
                        'message': message,
                        'request':
                            {
                                'color_counter': color_counter,
                                'clusters': clusters,
                                'bbox_proposals': bbox_proposals
                            }}), status=200)

    except Exception as e:
        dba.session.rollback()
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

