import sys
import os

from appadmin.models.interface_model import User
from appadmin.utils.localization_manager import LocalizationManager

from flask_user.access import is_authenticated, is_confirmed_email
from flask import Blueprint, render_template, redirect, request, url_for, flash, Response
from flask_login import (
    current_user,
    login_required,
    login_user,
    logout_user
)
from .forms import LoginForm


import json
import requests


blp = Blueprint(
    'base',
    __name__,
    url_prefix='',
    template_folder='templates',
    static_folder='static'
)


@blp.route('/')
def route_default():
    return redirect(url_for('base.login'))


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
    if 'login' in request.form:
        username = str(request.form['username'])
        password = str(request.form['password'])

        user = User.query.filter(User.username == username).first()
        
        if user and user.valid_password(password) and user.active:
            login_user(user)
            return redirect(url_for('base.route_default'))

        locale = LocalizationManager().get_blueprint_locale(blp.name)
        if user and not user.active:
            flash(locale.user_not_active_error, 'error')
        else:
            flash(locale.user_incorrect_error, 'error')

    try:
        if not current_user.is_authenticated:
            return render_template(
                'login/login.html',
                login_form=login_form,
                enumerate=enumerate
            )

        try:
            response = requests.post(
                'http://127.0.0.1:8000', data=json.dumps({'message': 'login_succeed'}))
        except requests.exceptions.ConnectionError:
            pass

        return redirect('/main')
    except Exception as ex:
        return render_template(
                'login/login.html',
                login_form=login_form,
                enumerate=enumerate
            )


@blp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('base.login'))
