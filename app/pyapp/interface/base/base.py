import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../"))

from models.interface_model import User

#from tools.db_manager imDBManagerport 

from flask import Blueprint, render_template, redirect, request, url_for, flash, Response
from flask_login import (
    current_user,
    login_required,
    login_user,
    logout_user
)
from .forms import LoginForm, CreateAccountForm

import json
import requests


blp = Blueprint(
    'base_blueprint',
    __name__,
    url_prefix='',
    template_folder='templates',
    static_folder='static'
)


@blp.route('/')
def route_default():
    return redirect(url_for('base_blueprint.login'))


"""
@blp.route('/<template>')
@login_required
def route_template(template):
    return render_template(template + '.html')
"""

@blp.route('/fixed_<template>')
@login_required
def route_fixed_template(template):
    return render_template('fixed/fixed_{}.html'.format(template))


@blp.route('/page_<error>')
def route_errors(error):
    return render_template('errors/page_{}.html'.format(error))

@blp.route('/ask', methods=['GET', 'POST'])
def ask():
    if not current_user.is_authenticated:
        logged = False
    else:
        logged = True
        
    return Response(json.dumps({'message': logged}), status=200)

@blp.route('/send_data', methods=['GET', 'POST'])
def send_data():
    response = requests.post('http://127.0.0.1:8000', data=json.dumps({'message': 'hello world'}))

    return "hellow"

## Login & Registration


@blp.route('/login', methods=['GET', 'POST'])
def login():
    login_form = LoginForm(request.form)
    create_account_form = CreateAccountForm(request.form)
    if 'login' in request.form:
        username = str(request.form['username'])
        password = str(request.form['password'])

        user = User.query.filter(User.username == username).first()
        
        if user and user.valid_password(password) and user.active:
            login_user(user)
            return redirect(url_for('base_blueprint.route_default'))

        if user and not user.active:
            flash('Your username is not active. Talk to your administrator.', 'error')
        else:
            flash('Username or password incorrect.', 'error')

    try:
        if not current_user.is_authenticated:
            return render_template(
                'login/login.html',
                login_form=login_form,
                create_account_form=create_account_form, enumerate=enumerate
            )
        return redirect('/main')
    except:
        return render_template(
                'login/login.html',
                login_form=login_form,
                create_account_form=create_account_form, enumerate=enumerate
            )


@blp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('base_blueprint.login'))

## Errors



@blp.errorhandler(403)
def access_forbidden(error):
    return render_template('errors/page_403.html'), 403


@blp.errorhandler(404)
def not_found_error(error):
    return render_template('errors/page_404.html'), 404


@blp.errorhandler(500)
def internal_error(error):
    return render_template('errors/page_500.html'), 500
