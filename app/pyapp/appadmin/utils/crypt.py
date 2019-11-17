from cryptography.fernet import Fernet
from base64 import b64encode, b64decode

from appadmin.utils.singleton import Singleton


class Crypt(metaclass=Singleton):

    def __init__(self):
        self.fernet = Fernet(Fernet.generate_key())

    def encrypt(self, str_to_enc):
        return self.fernet.encrypt(str_to_enc.encode()).decode('utf-8')

    def decrypt(self, enc_str):
        if enc_str:
            return self.fernet.decrypt(enc_str.encode()).decode('utf-8')
        else:
            return enc_str
