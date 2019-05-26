import hashlib
from unidecode import unidecode
from datetime import date, time, datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from urllib.parse import quote_plus

db = SQLAlchemy()


class Organizer(db.Model):
    __tablename__ = "organizers"

    id = db.Column(db.Integer(), db.Sequence('organizers_id_seq'), primary_key=True)
    hash = db.Column(db.BigInteger, unique=True, nullable=False, index=True)

    name = db.Column(db.String(32), nullable=False)
    surnames = db.Column(db.String(64), nullable=False)
    picture = db.Column(db.String(256), nullable=True)
    about = db.Column(db.String(256), nullable=True)

    time_created = db.Column(
        db.DateTime(timezone=True), server_default=db.func.now())
    time_updated = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.now())

    editions_as_chief_of_course = db.relationship(
        'Edition', backref='organizers_chief_of_course', foreign_keys='Edition.chief_of_course_id')
    editions_as_start_referee = db.relationship(
        'Edition', backref='organizers_start_referee', foreign_keys='Edition.start_referee_id')
    editions_as_finish_referee = db.relationship(
        'Edition', backref='organizers_finish_referee', foreign_keys='Edition.finish_referee_id')

    __table_args__ = (
        db.UniqueConstraint('name', 'surnames', name='organizers_uc'),)

    def __init__(
            self, name: str = None, surnames: str = None, picture: str = None, about: str = None):
        if name:
            self.name = name.strip().title()

        if surnames:
            all_surnames = surnames.strip().title().split(' ')
            all_surnames = [surname for surname in all_surnames if surname != '']
            self.surnames = ' '.join(all_surnames)

        self.hash = Organizer.create_hash(self.name, self.surnames)

        self.about = about

        if not picture:
            picture = '/static/images/NO_IMAGE.jpg'

        self.picture = picture

    def __repr__(self):
        return f'<Organizer: [{self.id}, {self.name}, {self.surnames}]>'

    @property
    def full_name(self):
        return f'{self.name} {self.surnames}'

    @property
    def updated(self):
        if self.time_updated:
            return quote_plus(str(self.time_updated))
        else:
            return 'none'

    @property
    def times_as_chief_of_course(self):
        sql_query = "SELECT COUNT(*) "\
                    "FROM organizers "\
                    "JOIN editions ON editions.chief_of_course_id = organizers.id "\
                    f"WHERE organizers.id = {self.id}"

        return db.session.execute(sql_query).fetchone()[0]

    @property
    def times_as_start_referee(self):
        sql_query = "SELECT COUNT(*) "\
                    "FROM organizers "\
                    "JOIN editions ON editions.start_referee_id = organizers.id "\
                    f"WHERE organizers.id = {self.id}"

        return db.session.execute(sql_query).fetchone()[0]

    @property
    def times_as_finish_referee(self):
        sql_query = "SELECT COUNT(*) "\
                    "FROM organizers "\
                    "JOIN editions ON editions.finish_referee_id = organizers.id "\
                    f"WHERE organizers.id = {self.id}"

        return db.session.execute(sql_query).fetchone()[0]

    def mark_as_updated(self):
        self.time_updated = db.func.now()

    @staticmethod
    def create_hash(name, surnames):
        return int(
            hashlib.sha256(
                f'{unidecode(name.strip().title())}_{unidecode(surnames.strip().title())}'.encode(
                    'utf-8')).hexdigest(), 16) % (2 ** 63)

    @staticmethod
    def create_hash_from_full_name(full_name):
        elements = full_name.strip().title().split(' ')
        all_surnames = [surname for surname in elements[1:] if surname != '']
        surnames = ' '.join(all_surnames)
        name = elements[0]

        return Organizer.create_hash(name, surnames)

    @staticmethod
    def get_organizers():
        sql_query = "SELECT printf('%s %s', organizers.name, organizers.surnames) "\
                    "FROM organizers"
        
        return [name[0] for name in db.session.execute(sql_query).fetchall()]

    @staticmethod
    def get_times_as_job(job):
        sql_query = "SELECT COUNT(*) AS count, " \
                    "printf('%s %s', organizers.name, organizers.surnames) AS organizer "\
                    "FROM organizers " \
                    f"JOIN editions ON editions.{job}_id = organizers.id " \
                    "GROUP BY organizers.id"\

        count = []
        organizer = []
        rows = db.session.execute(sql_query).fetchall()

        if not rows:
            return {
                'count': [],
                'organizer': []
            }

        for row in rows:
            count.append(int(row['count']))
            organizer.append(row['organizer'])

        return {
            'count': count,
            'organizer': organizer
        }

    @staticmethod
    def get_times_as_chief_of_course():
        return Organizer.get_times_as_job('chief_of_course')

    @staticmethod
    def get_times_as_start_referee():
        return Organizer.get_times_as_job('start_referee')

    @staticmethod
    def get_times_as_finish_referee():
        return Organizer.get_times_as_job('finish_referee')


class Participant(db.Model):
    __tablename__ = "participants"

    id = db.Column(db.Integer(), db.Sequence('editions_id_seq'), primary_key=True)
    hash = db.Column(db.BigInteger, unique=True, nullable=False, index=True)

    name = db.Column(db.String(32), nullable=False)
    surnames = db.Column(db.String(64), nullable=False)
    birthday = db.Column(db.Date(), nullable=False)
    picture = db.Column(db.String(256), nullable=True)

    time_created = db.Column(
        db.DateTime(timezone=True), server_default=db.func.now())
    time_updated = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.now())

    edition_participants = db.relationship(
        'EditionParticipant', backref='participants', cascade="all,delete")

    __table_args__ = (
        db.UniqueConstraint('name', 'surnames', 'birthday', name='participants_uc'),)

    def __init__(
            self, name: str = None, surnames: str = None, birthday: date = None,
            picture: str = None):
        if name:
            self.name = name.strip().title()

        if surnames:
            all_surnames = surnames.strip().title().split(' ')
            all_surnames = [surname for surname in all_surnames if surname != '']
            self.surnames = ' '.join(all_surnames)

        self.birthday = birthday

        if not picture:
            picture = '/static/images/NO_IMAGE.jpg'

        self.picture = picture

        self.hash = int(
            hashlib.sha256(
                f'{unidecode(self.name)}_{unidecode(self.surnames)}_'\
                    f'{self.birthday.strftime("%Y-%m-%d")}'.encode(
                    'utf-8')).hexdigest(), 16) % (2 ** 63)

    def __repr__(self):
        return f'<Participant: [{self.id}, {self.name}, {self.surnames}, {self.birthday}]>'

    @property
    def updated(self):
        if self.time_updated:
            return quote_plus(str(self.time_updated))
        else:
            return 'none'
            

class Edition(db.Model):
    __tablename__ = "editions"

    id = db.Column(db.Integer(), db.Sequence('editions_id_seq'), primary_key=True)
    edition = db.Column(db.Integer, nullable=False, unique=True)
    date = db.Column(db.Date(), nullable=False)
    picture = db.Column(db.String(256), nullable=True)

    chief_of_course_id = db.Column(
        db.Integer(), db.ForeignKey(
            'organizers.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)
    start_referee_id = db.Column(
        db.Integer(), db.ForeignKey(
            'organizers.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)
    finish_referee_id = db.Column(
        db.Integer(), db.ForeignKey(
            'organizers.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)

    time_created = db.Column(
        db.DateTime(timezone=True), server_default=db.func.now())
    time_updated = db.Column(
        db.DateTime(timezone=True), onupdate=db.func.now())

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
            start_referee: Organizer = None, finish_referee: Organizer = None, picture: str = None):

        self.date = date
        self.edition = edition

        self.chief_of_course_id = None if not chief_of_course else chief_of_course.id
        self.start_referee_id = None if not start_referee else start_referee.id
        self.finish_referee_id = None if not finish_referee else finish_referee.id

        if not picture:
            picture = '/static/images/NO_IMAGE.jpg'

        self.picture = picture

    def __repr__(self):
        return f'<Edition: [{self.id}, {self.date}, {self.edition}]>'

    @property
    def year(self):
        return self.date.year

    @property
    def updated(self):
        if self.time_updated:
            return quote_plus(str(self.time_updated))
        else:
            return 'none'

    @property
    def number_of_participants(self):
        return len(self.participants)

    @property
    def number_of_clubs(self):
        sql_query = "SELECT COUNT(DISTINCT(edition_participants.club_id)) AS clubs " \
                    "FROM edition_participants " \
                    "JOIN editions ON editions.id = edition_participants.edition_id " \
                    f"WHERE editions.id = {self.id}"
        
        return db.session.execute(sql_query).fetchone()[0]

    def mark_as_updated(self):
        self.time_updated = db.func.now()

    @staticmethod
    def get_next_edition():
        sql_query = "SELECT MAX(editions.edition) "\
                    "FROM editions"
        
        return db.session.execute(sql_query).fetchone()[0] + 1

    @staticmethod
    def get_next_year():
        sql_query = "SELECT STRFTIME(\"%Y\", MAX(editions.date)) "\
                    "FROM editions"
        
        return int(db.session.execute(sql_query).fetchone()[0]) + 1


    @staticmethod
    def get_number_of_participants_per_edition():
        sql_query = "SELECT strftime(\"%Y\", editions.date) AS year, "\
                    "COUNT(edition_participants.participant_id) AS participants " \
                    "FROM edition_participants " \
                    "JOIN editions ON editions.id = edition_participants.edition_id " \
                    "GROUP BY editions.id " \
                    "ORDER BY year ASC" \

        years = []
        participants = []
        rows = db.session.execute(sql_query).fetchall()

        if not rows:
            return {
                'years': [],
                'participants': []
            }

        for row in rows:
            years.append(int(row['year']))
            participants.append(int(row['participants']))

        return {
            'years': years,
            'participants': participants
        }


    @staticmethod
    def get_number_of_clubs_per_edition():
        sql_query = "SELECT strftime(\"%Y\", editions.date) AS year, "\
                    "COUNT(DISTINCT(edition_participants.club_id)) AS clubs " \
                    "FROM edition_participants " \
                    "JOIN editions ON editions.id = edition_participants.edition_id " \
                    "GROUP BY editions.id " \
                    "ORDER BY year ASC" \

        years = []
        clubs = []
        rows = db.session.execute(sql_query).fetchall()

        if not rows:
            return {
                'years': [],
                'clubs': []
            }

        for row in rows:
            years.append(int(row['year']))
            clubs.append(int(row['clubs']))

        return {
            'years': years,
            'clubs': clubs
        }

    @staticmethod
    def get_editions():
        sql_query = "SELECT editions.id AS id, strftime(\"%Y\", editions.date) AS year " \
                    "FROM editions " \
                    "ORDER BY year DESC"

        query = db.session.execute(sql_query)
        keys = query.keys()

        return [dict(zip(keys, row)) for row in query.fetchall()]

    
    @staticmethod
    def get_participants(edition_id: int):
        sql_query = "SELECT "\
                    "participants.id AS id, " \
                    "printf(\"%s?stam%s\", participants.picture, " \
                    "strftime(\"%Y%m%d%H%M%S\", participants.time_updated)) AS picture, " \
                    "participants.surnames AS surnames, " \
                    "participants.name AS name, " \
                    "participants.birthday AS birthday, " \
                    "edition_participants.bib_number AS bib_number, " \
                    "edition_participants.category AS category, " \
                    "edition_participants.penalized AS penalized, " \
                    "edition_participants.disqualified AS disqualified, " \
                    "edition_participants.not_arrived AS not_arrived, " \
                    "edition_participants.not_came_out AS not_came_out, " \
                    "edition_participants.time AS time, " \
                    "edition_participants.time AS time_final, " \
                    "clubs.id AS club_id, " \
                    "clubs.name AS club_name, " \
                    "editions.id AS edition_id, " \
                    "editions.date AS edition_date " \
                    "FROM edition_participants " \
                    "JOIN participants ON participants.id = edition_participants.participant_id " \
                    "JOIN editions ON editions.id = edition_participants.edition_id " \
                    "JOIN clubs ON clubs.id = edition_participants.club_id " \
                    f"WHERE editions.id = {edition_id} "\
                    "ORDER BY participants.surnames, participants.name ASC"

        penalizations = Edition.get_penalizations(edition_id)
        query = db.session.execute(sql_query)
        keys = query.keys()

        result = [dict(zip(keys, row)) for row in query.fetchall()]
        for element in result:
            element['time'] = element['time'][3:-4]
            if element['category'] in penalizations and element['penalized'] == 1:
                element['time_final'] = (
                    datetime.strptime(element['time_final'], "%H:%M:%S.%f") +
                    penalizations[element['category']]).strftime("%H:%M:%S.%f")
            element['time_final'] = element['time_final'][3:-4]

        return result

    @staticmethod
    def get_penalizations(edition_id: int):
        sql_query = "SELECT edition_participants.category AS category, " \
                    "    MAX(edition_participants.time) AS time " \
                    "FROM edition_participants " \
                    "JOIN editions ON editions.id = edition_participants.edition_id " \
                    "WHERE editions.id = 10 AND " \
                    "    edition_participants.penalized = 0 AND " \
                    "    edition_participants.disqualified = 0 AND " \
                    "    edition_participants.not_arrived = 0 AND " \
                    "    edition_participants.not_came_out = 0 " \
                    "GROUP BY edition_participants.category " \
                    "ORDER BY edition_participants.category ASC "

        query = db.session.execute(sql_query)
        t0 = datetime.strptime("00:00:00.00000","%H:%M:%S.%f")
        return {row['category']: (datetime.strptime(row['time'], "%H:%M:%S.%f") - t0)
                for row in query.fetchall()}

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
            emblem = '/static/images/NO_IMAGE.jpg'

        self.emblem = emblem

    @property
    def updated(self):
        if self.time_updated:
            return quote_plus(str(self.time_updated))
        else:
            return 'none'

    def mark_as_updated(self):
        self.time_updated = db.func.now()

    def __repr__(self):
        return f'<Club: [{self.id}, {self.acronym}, {self.name}]>'

    @staticmethod
    def get_clubs():
        sql_query = "SELECT clubs.id AS id, clubs.name AS name " \
                    "FROM clubs " \
                    "ORDER BY clubs.name"

        query = db.session.execute(sql_query)
        keys = query.keys()
        return [dict(zip(keys, row)) for row in query.fetchall()]


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
    disqualified = db.Column(db.Boolean)
    not_arrived = db.Column(db.Boolean)
    not_came_out = db.Column(db.Boolean)

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
            disqualified: bool = False,
            not_arrived: bool = False,
            not_came_out: bool = False,
            time: time = None
        ):

        self.edition_id = edition.id
        self.participant_id = participant.id
        self.club_id = club.id

        self.category = edition.date.year - participant.birthday.year

        self.bib_number = bib_number
        self.penalized = penalized
        self.disqualified = disqualified
        self.not_arrived = not_arrived
        self.not_came_out = not_came_out
        self.time = time        

    @property
    def penalize(self):
        return self.penalized

    @penalize.setter
    def penalize(self, value: bool):
        self.penalized = value

    @property
    def disqualify(self):
        return self.disqualified
        
    @disqualify.setter
    def disqualify(self, value: bool):
        if not value:
            self.disqualified = False
            return

        self.disqualified = True
        self.not_arrived = False
        self.not_came_out = False

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
