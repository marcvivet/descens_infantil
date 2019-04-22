import hashlib
from unidecode import unidecode
from datetime import date, time
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Participant(db.Model):
    __tablename__ = "participants"

    id = db.Column(db.Integer(), db.Sequence('editions_id_seq'), primary_key=True)
    hash = db.Column(db.BigInteger, unique=True, nullable=False, index=True)

    name = db.Column(db.String(32), nullable=False)
    surnames = db.Column(db.String(64), nullable=False)
    birthday = db.Column(db.Date(), nullable=False)

    __table_args__ = (
            db.UniqueConstraint('name', 'surnames', 'birthday', name='edition_participants_uc'),)

    def __init__(self, name: str = None, surnames: str = None, birthday: date = None):
        if name:
            self.name = name.strip().title()

        if surnames:
            all_surnames = surnames.strip().title().split(' ')
            all_surnames = [surname for surname in all_surnames if surname != '']
            self.surnames = ' '.join(all_surnames)

        self.birthday = birthday

        self.hash = int(
            hashlib.sha256(
                f'{unidecode(self.name)}_{unidecode(self.surnames)}_'\
                    f'{self.birthday.strftime("%Y-%m-%d")}'.encode(
                    'utf-8')).hexdigest(), 16) % (2 ** 63)

    def __repr__(self):
        return f'<Participant: [{self.id}, {self.name}, {self.surnames}, {self.birthday}]>'
            

class Edition(db.Model):
    __tablename__ = "editions"

    id = db.Column(db.Integer(), db.Sequence('editions_id_seq'), primary_key=True)
    edition = db.Column(db.Integer, nullable=True)
    date = db.Column(db.Date(), nullable=True)
    chief_of_course = db.Column(db.String(128), nullable=True)
    start_referee = db.Column(db.String(128), nullable=True)
    finish_referee = db.Column(db.String(128), nullable=True)

    participants = db.relationship(
        'Participant', secondary='edition_participants', order_by='Participant.id')

    def __init__(
            self, edition: int = None, chief_of_course: str = None,
            start_referee: str = None, finish_referee: str = None, date: date = None):

        self.date = date
        self.edition = edition

        self.chief_of_course = None if not chief_of_course else chief_of_course.title()
        self.start_referee = None if not start_referee else start_referee.title()
        self.finish_referee = None if not finish_referee else finish_referee.title()

    def __repr__(self):
        return f'<Edition: [{self.id}, {self.date}, {self.edition}, {self.chief_of_course}, {self.start_referee}, {self.finish_referee}]>'

class Club(db.Model):
    __tablename__ = "clubs"

    id = db.Column(db.Integer(), db.Sequence('clubs_id_seq'), primary_key=True)
    club = db.Column(db.String(8), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    logo = db.Column(db.String(256), nullable=True)

    members = db.relationship(
        'Participant', secondary='edition_participants', order_by='Participant.id')

    def __init__(
            self, id: int = None, club: str = None, name: str = None, logo: str = None):
        self.id = id if id else self.id
        
        if club:
            self.club = club.upper()

        if name:
            self.name = name.title()

        if not logo:
            logo = 'NO_LOGO.png'

        self.logo = logo

    def __repr__(self):
        return f'<Club: [{self.id}, {self.club}, {self.name}, {self.logo}]>'


class EditionParticipant(db.Model):
    __tablename__ = "edition_participants"

    edition_id = db.Column(
        db.Integer(), db.ForeignKey(
            'editions.id', ondelete='CASCADE', onupdate='CASCADE'), primary_key=True)

    participant_id = db.Column(
        db.BigInteger(), db.ForeignKey(
            'participants.id', ondelete='CASCADE', onupdate='CASCADE'), primary_key=True)

    club_id = db.Column(
        db.Integer(), db.ForeignKey(
            'clubs.id', ondelete='CASCADE', onupdate='CASCADE'))

    bib_number = db.Column(db.Integer)
    category = db.Column(db.Integer)
    penalized = db.Column(db.Boolean)
    desqualified = db.Column(db.Boolean)
    not_arrived = db.Column(db.Boolean)
    not_come_out = db.Column(db.Boolean)

    time = db.Column(db.Time(), nullable=True)

    time_created = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    time_updated = db.Column(db.DateTime(timezone=True), onupdate=db.func.now())

    edition = db.relationship('Edition', uselist=False)
    participant = db.relationship('Participant', uselist=False)
    club = db.relationship('Club', uselist=False)

    __table_args__ = (
         db.UniqueConstraint('edition_id', 'participant_id', name='edition_participants_uc'),)

    def __init__(
            self,
            edition: Edition,
            participant: Participant,
            club: Club,
            bib_number: int = None,
            penalized: bool = False,
            desqualified: bool = False,
            not_arrived: bool = False,
            not_come_out: bool = False,
            time: time = None
        ):

        self.edition_id = edition.id
        self.participant_id = participant.id
        self.club_id = club.id

        self.category = edition.date.year - participant.birthday.year

        self.bib_number = bib_number
        self.penalized = penalized
        self.desqualified = desqualified
        self.not_arrived = not_arrived
        self.not_come_out = not_come_out
        self.time = time        

    @property
    def penalize(self):
        return self.penalized

    @penalize.setter
    def penalize(self, value: bool):
        self.penalized = value

    @property
    def desqualify(self):
        return self.desqualified
        
    @desqualify.setter
    def desqualify(self, value: bool):
        if not value:
            self.desqualified = False
            return

        self.desqualified = True
        self.not_arrived = False
        self.not_come_out = False

    @property
    def not_arrive(self):
        return self.not_arrive
        
    @not_arrive.setter
    def not_arrive(self, value: bool):
        if not value:
            self.not_arrive = False
            return

        self.desqualified = False
        self.not_arrived = True
        self.not_came_out = False

    @property
    def not_come_out(self):
        return self.not_came_out
        
    @not_come_out.setter
    def not_come_out(self, value: bool):
        if not value:
            self.not_came_out = False
            return

        self.desqualified = False
        self.not_arrived = False
        self.not_came_out = True


