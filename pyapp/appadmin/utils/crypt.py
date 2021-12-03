from cryptography.fernet import Fernet, InvalidToken
from base64 import b64encode, b64decode

from appadmin.utils.singleton import Singleton


class Crypt(metaclass=Singleton):

    def __init__(self):
        self.fernet = Fernet(Fernet.generate_key())

    def encrypt(self, str_to_enc):
        return self.fernet.encrypt(str_to_enc.encode()).decode('utf-8')

    def decrypt(self, enc_str):
        if enc_str:
            try:
                return self.fernet.decrypt(enc_str.encode()).decode('utf-8')
            except InvalidToken:
                return None
        else:
            return enc_str
