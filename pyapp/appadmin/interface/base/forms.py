from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField

## login and registration


class LoginForm(FlaskForm):
    username = StringField('username')
    password = PasswordField('password')
