import os
import json
import colorsys

from flask import Blueprint, render_template, request, Response
from flask_login import login_required

from appadmin.utils.blueprint_utils import roles_required_online
from appadmin.utils.localization_manager import LocalizationManager
from appadmin.models.descens_infantil_model import Edition, Organizer


blp = Blueprint(
    'statistics',
    __name__,
    url_prefix='/statistics',
    template_folder='templates',
    static_folder='static',
    static_url_path='/static'
)

def hsv_to_rgb(hue, saturation, value, factor=200):
    """Convert a color from hsv to rgb.

    Args:
        hue (float): Hue
        saturation (float): Saturation
        value (float): Value
        factor (int, optional): defaults to 200. Number that goes from 0 to 255 to define the
            luminosity of the color.

    Returns:
        list: RGB color.

    """
    (red, green, blue) = colorsys.hsv_to_rgb(hue, saturation, value)
    return '#%02x%02x%02x' % (int(factor * red), int(factor * green), int(factor * blue))


def get_distinct_colors(number, factor=200):
    """Generate ``number`` distinc colors.

    Args:
        number (int): Number of colors to be generated.
        factor (int, optional): defaults to 200. Number that goes from 0 to 255 to define the
            luminosity of the color.

    Returns:
        list: List of colors.

    """
    hue_partition = 1.0 / (number + 1)
    return list(hsv_to_rgb(
        hue_partition * value, 1.0, 1.0, factor=factor) for value in range(0, number))


def add_colors_to_dict(key, keys, elements):
    colors = get_distinct_colors(len(keys))
    keys_colors = dict(zip(keys, colors))

    elements['colors'] = []
    for ele in elements[key]:
        elements['colors'].append(keys_colors[ele])


@blp.route('/editions', methods=['GET'])
@login_required
def editions():
    return render_template('statistics_editions.html', **locals())


@blp.route('/organizers', methods=['GET'])
@login_required
def organizers():
    return render_template('statistics_organizers.html', **locals())


@blp.route('/communicate', methods=['POST'])
@roles_required_online(blp)
def communicate():
    message = None
    response = None
    status = 200

    try:
        json_data = json.loads(request.data.decode('utf-8'))

        if json_data['action'] == 'get_locale':
            message = LocalizationManager().get_blueprint_locale(blp.name)._locale

        if json_data['action'] == 'get_number_of_participants_per_edition':
            message = Edition.get_number_of_participants_per_edition()

        if json_data['action'] == 'get_number_of_clubs_per_edition':
            message = Edition.get_number_of_clubs_per_edition()

        if json_data['action'] == 'get_times_as_chief_of_course':
            message = Organizer.get_times_as_chief_of_course()
            organizers = Organizer.get_organizers()
            add_colors_to_dict('organizer', organizers, message)

        if json_data['action'] == 'get_times_as_start_referee':
            message = Organizer.get_times_as_start_referee()
            organizers = Organizer.get_organizers()
            add_colors_to_dict('organizer', organizers, message)

        if json_data['action'] == 'get_times_as_finish_referee':
            message = Organizer.get_times_as_finish_referee()
            organizers = Organizer.get_organizers()
            add_colors_to_dict('organizer', organizers, message)
        
        if not response:
            response = json.dumps({'message': message})
    except Exception as e:
        blp.db_manager.rollback()
        locm = LocalizationManager().get_blueprint_locale(blp.name)
        error_msg = locm.exception.format(e)
        print(error_msg)
        state = 'error'
        response = error_msg
        status = 500

    return Response(response, status=status)
