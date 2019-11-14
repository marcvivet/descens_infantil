
import os
import logging
import json
from typing import Any

from flask_login import current_user
from flask_user.access import is_authenticated

from appadmin.models.interface_model import Language


class LocalizedException(Exception):
    """Custom Exception for Augmenters."""

    def __init__(self, message, blp="base"):
        """Create a new exception.

        Arguments:
            message (str): Exception description

        """
        super().__init__(LocalizationManager().get_blueprint_locale(blp)[message])


class Singleton(type):
    _instance = None

    def __call__(cls, *args, **kwargs):
        singleton = kwargs.pop('singleton', True)

        if not singleton:
            return super(Singleton, cls).__call__(*args, **kwargs)

        if not cls._instance:
            cls._instance = \
                super(Singleton, cls).__call__(*args, **kwargs)
        
        # REMOVE THIS AT THE END
        # cls._instance.reload()
        return cls._instance


class LocaleData:
    def __init__(self, file_path: str):
        self._locale = None
        self._file = file_path

        self.reload()

    def reload(self):
        if os.path.exists(self._file):
            with open(self._file, 'r', encoding='utf-8') as read_fp:
                self._locale = json.load(read_fp)

    @property
    def locale(self):
        return self._locale

    def __getitem__(self, key):
        if key in self._locale:
            return self._locale[key]

        return key

    def __getattr__(self, key: str) -> Any:
        """Get a model property."""
        if key.startswith('_'):
            return super().__getattribute__(key)

        if key in self._locale:
            return self._locale[key]

        try:
            return super().__getattribute__(key)
        except:
            return key


class LocalizationManager(metaclass=Singleton):

    def __init__(self, **kwargs):
        self._logger = logging.getLogger(__name__)
        self._locale = {
            'en': {},
            'ca': {}
        }

        self._default_locale = 'ca'

    def add_bluprint_by_path(self, blp_path):
        blp_name = os.path.basename(blp_path)
        try:
            for iso_639_1 in self._locale:
                language_file = os.path.join(blp_path, 'locale', f'{iso_639_1}.json')
                self._locale[iso_639_1][blp_name] = LocaleData(language_file)
        except:
            self._logger.error(
                "Error while parsing locale JSON for blueprint %s, language %s",
                blp_name, iso_639_1)

    def add_blueprint(self, blp):
        try:
            for iso_639_1 in self._locale:
                language_file = os.path.join(blp.root_path, 'locale', f'{iso_639_1}.json')
                self._locale[iso_639_1][blp.name] = LocaleData(language_file)
        except:
            self._logger.error("Error while parsing locale JSON for blueprint %s, language %s", blp.name, iso_639_1)
            raise

    def reload(self):
        for iso_6369, data in self._locale.items():
            for _, locale_data in data.items():
                locale_data.reload()

    def get_blueprint_locale(self, blp):
        return self.locale[blp]

    @property
    def locale(self):
        return self._locale[self.user_locale]

    @property
    def user_locale(self):
        try:
            if is_authenticated():
                return current_user.language.iso_639_1
        except AttributeError:
            pass

        return self._default_locale

    def __getitem__(self, key):
        if key in self._locale:
            return self._locale[key]

        self._logger.warning("Localization key %s is undefined.", key)
        return None


    def __getattr__(self, key: str) -> Any:
        """Get a model property."""
        if key in ('locale', 'user_locale') or key.startswith('_'):
            return super().__getattribute__(key)

        locale = self.locale

        try:
            if key in locale:
                return locale[key]

            return super().__getattribute__(key)
        except:
            self._logger.warning("Localization key %s is undefined.", key)
            return key