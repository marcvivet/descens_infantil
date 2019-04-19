from flask_wtf import FlaskForm
from wtforms import TextField, PasswordField

## login and registration


class LoginForm(FlaskForm):
    username = TextField('Username')
    password = PasswordField('Password')


class CreateAccountForm(FlaskForm):
    username2 = TextField('Username')
    name = TextField('Name')
    surname = TextField('Surname')
    phone = TextField('Phone')
    email = TextField('Email')
    password2 = PasswordField('Password')
