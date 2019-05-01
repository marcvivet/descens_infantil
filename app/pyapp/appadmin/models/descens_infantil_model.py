import hashlib
from unidecode import unidecode
from datetime import date, time
from flask_sqlalchemy import SQLAlchemy
from urllib.parse import quote_plus

db = SQLAlchemy()


class Organizer(db.Model):
    __tablename__ = "organizers"

    id = db.Column(db.Integer(), db.Sequence('organizers_id_seq'), primary_key=True)
    hash = db.Column(db.BigInteger, unique=True, nullable=False, index=True)

    name = db.Column(db.String(32), nullable=False)
    surnames = db.Column(db.String(64), nullable=False)

    editions_as_chief_of_course = db.relationship(
        'Edition', backref='organizers_chief_of_course', foreign_keys='Edition.chief_of_course_id')
    editions_as_start_referee = db.relationship(
        'Edition', backref='organizers_start_referee', foreign_keys='Edition.start_referee_id')
    editions_as_finish_referee = db.relationship(
        'Edition', backref='organizers_finish_referee', foreign_keys='Edition.finish_referee_id')

    __table_args__ = (
        db.UniqueConstraint('name', 'surnames', name='organizers_uc'),)

    def __init__(self, name: str = None, surnames: str = None):
        if name:
            self.name = name.strip().title()

        if surnames:
            all_surnames = surnames.strip().title().split(' ')
            all_surnames = [surname for surname in all_surnames if surname != '']
            self.surnames = ' '.join(all_surnames)

        self.hash = Organizer.create_hash(self.name, self.surnames)

    def __repr__(self):
        return f'<Organizer: [{self.id}, {self.name}, {self.surnames}]>'

    @staticmethod
    def create_hash(name, surnames):
        return int(
            hashlib.sha256(
                f'{unidecode(name)}_{unidecode(surnames)}'.encode(
                    'utf-8')).hexdigest(), 16) % (2 ** 63)


class Participant(db.Model):
    __tablename__ = "participants"

    id = db.Column(db.Integer(), db.Sequence('editions_id_seq'), primary_key=True)
    hash = db.Column(db.BigInteger, unique=True, nullable=False, index=True)

    name = db.Column(db.String(32), nullable=False)
    surnames = db.Column(db.String(64), nullable=False)
    birthday = db.Column(db.Date(), nullable=False)

    edition_participants = db.relationship(
        'EditionParticipant', backref='participants', cascade="all,delete")

    __table_args__ = (
        db.UniqueConstraint('name', 'surnames', 'birthday', name='participants_uc'),)

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
    chief_of_course_id = db.Column(
        db.Integer(), db.ForeignKey(
            'organizers.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)
    start_referee_id = db.Column(
        db.Integer(), db.ForeignKey(
            'organizers.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)
    finish_referee_id = db.Column(
        db.Integer(), db.ForeignKey(
            'organizers.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)

    chief_of_course = db.relationship(
        'Organizer', foreign_keys=[chief_of_course_id], uselist=False)
    start_referee = db.relationship('Organizer', foreign_keys=[start_referee_id], uselist=False)
    finish_referee = db.relationship('Organizer', foreign_keys=[finish_referee_id], uselist=False)

    participants = db.relationship(
        'Participant', secondary='edition_participants', order_by='Participant.id')

    edition_participants = db.relationship(
        'EditionParticipant', backref='editions', cascade="all,delete")

    def __init__(
            self, edition: int = None, date: date = None, chief_of_course: Organizer = None,
            start_referee: Organizer = None, finish_referee: Organizer = None):

        self.date = date
        self.edition = edition

        self.chief_of_course_id = None if not chief_of_course else chief_of_course.id
        self.start_referee_id = None if not start_referee else start_referee.id
        self.finish_referee_id = None if not finish_referee else finish_referee.id

    def __repr__(self):
        return f'<Edition: [{self.id}, {self.date}, {self.edition}]>'

class Club(db.Model):
    __tablename__ = "clubs"

    id = db.Column(db.Integer(), db.Sequence('clubs_id_seq'), primary_key=True)
    acronym = db.Column(db.String(8), nullable=False, unique=True)
    name = db.Column(db.String(128), nullable=False)
    emblem = db.Column(db.String(256), nullable=True)
    about = db.Column(db.String(256), nullable=True)
    email = db.Column(db.String(32), nullable=True)
    phone = db.Column(db.String(20), nullable=True)

    edition_participants = db.relationship('EditionParticipant', backref='clubs')

    time_created = db.Column(
        db.DateTime(timezone=True), server_default=db.func.now())
    time_updated = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.now())

    def __init__(
            self, id: int = None, acronym: str = None, name: str = None, emblem: str = None,
            about: str = None, email: str = None, phone: str = None):
        self.id = id if id else self.id
        
        if acronym:
            self.acronym = acronym.upper()

        if name:
            self.name = name.title()

        self.about = about
        self.email = email
        self.phone = phone

        if not emblem:
            emblem = '/static/images/clubs/NO_LOGO.jpg'

        self.emblem = emblem

    def get_update_time(self):
        if self.time_updated:
            return quote_plus(str(self.time_updated))
        else:
            return 'none'

    def mark_as_updated(self):
        self.time_updated = db.func.now()

    def __repr__(self):
        return f'<Club: [{self.id}, {self.acronym}, {self.name}]>'


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
            'clubs.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)

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


