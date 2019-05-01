import os

from PIL import Image
import numpy as np

from appadmin.utils.localization_manager import LocalizedException
from appadmin.utils.blueprint_utils import config


def check_file_type(filename):
    result = '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ['png', 'jpg', 'jpeg', 'gif', 'bmp']

    if not result:
        raise LocalizedException("incorrect_picture", blp='base')


def save_centered_and_resized(picture_name, upload_folder):
    img_in = Image.open(os.path.join(upload_folder, picture_name))
    img_in.load()

    if img_in.mode == 'RGBA':
        img = Image.new("RGB", img_in.size, (255, 255, 255))
        img.paste(img_in, mask=img_in.split()[3])
    elif img_in.mode != 'RGB':
        img = img_in.convert('RGB')
    else:
        img = img_in

    width, height = img.size   # Get dimensions    

    width = np.size(img, 1)
    height = np.size(img, 0)

    new_width = np.min([width, height])

    left = np.floor((width - new_width) / 2.)
    top = np.floor((height - new_width) / 2.)
    right = np.floor(left + new_width - 1)
    bottom = np.floor(top + new_width - 1)
    img = img.crop((left, top, right, bottom))

    new_size = 400, 400
    img.thumbnail(new_size, Image.ANTIALIAS)

    os.remove(os.path.join(upload_folder, picture_name))
    new_file_name = ''
    for file_piece in picture_name.split('.')[:-1]:
        new_file_name += file_piece

    new_file_name += '.jpg'
    img.save(os.path.join(upload_folder, new_file_name), "JPEG", quality=95)

    return new_file_name


def save_resized(picture_name, upload_folder, max_size=500):
    img_in = Image.open(os.path.join(upload_folder, picture_name))
    img_in.load()

    if img_in.mode == 'RGBA':
        img = Image.new("RGB", img_in.size, (255, 255, 255))
        img.paste(img_in, mask=img_in.split()[3])
    elif img_in.mode != 'RGB':
        img = img_in.convert('RGB')
    else:
        img = img_in

    width, height = img.size   # Get dimensions    

    width = np.size(img, 1)
    height = np.size(img, 0)

    if width > height:
        if width > max_size:
            prop = max_size / width
            height *= prop
            width = max_size
    else:
        if height > max_size:
            prop = max_size / height
            width *= prop
            height = max_size

    new_size = width, height
    img.thumbnail(new_size, Image.ANTIALIAS)

    os.remove(os.path.join(upload_folder, picture_name))
    new_file_name = ''
    for file_piece in picture_name.split('.')[:-1]:
        new_file_name += file_piece

    new_file_name += '.jpg'
    img.save(os.path.join(upload_folder, new_file_name), "JPEG", quality=95)

    return new_file_name


def upload_square_picture(blp, file, new_name):
    if not file:
        return None

    if not file.filename:
        return None
    
    check_file_type(file.filename)
    extension = file.filename.split('.')[-1]
    picture = '{}.{}'.format(new_name, extension)

    upload_folder = os.path.join(config['UPLOAD_FOLDER'], blp.name)
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    file.save(os.path.join(upload_folder, picture))
    picture = save_centered_and_resized(picture, upload_folder)

    return f'/static/uploads/{blp.name}/{picture}'


def upload_small_picture(blp, file, new_name):
    if not file:
        return None

    if not file.filename:
        return None
    
    check_file_type(file.filename)
    extension = file.filename.split('.')[-1]
    picture = '{}.{}'.format(new_name, extension)

    upload_folder = os.path.join(config['UPLOAD_FOLDER'], blp.name)
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    file.save(os.path.join(upload_folder, picture))
    picture = save_resized(picture, upload_folder)

    return f'/static/uploads/{blp.name}/{picture}'
