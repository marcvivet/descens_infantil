from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Edition(db.Model):
    __tablename__ = "editions"

    id = db.Column(db.Integer(), db.Sequence('editions_id_seq'), primary_key=True)
    edition = db.Column(db.Integer, nullable=False)
    chief_of_course = db.Column(db.String(128), nullable=True)
    start_referee = db.Column(db.String(128), nullable=True)
    finish_referee = db.Column(db.String(128), nullable=True)

    participants = db.relationship(
        'Participant', secondary='edition_participants', order_by='Participant.id')


class Club(db.Model):
    __tablename__ = "clubs"

    id = db.Column(db.Integer(), db.Sequence('clubs_id_seq'), primary_key=True)
    club = db.Column(db.String(8), nullable=False)
    name = db.Column(db.String(128), nullable=False)

    members = db.relationship(
        'Participant', secondary='edition_participants', order_by='Participant.id')


class Participant(db.Model):
    __tablename__ = "participants"

    id = db.Column(db.Integer(), db.Sequence('participants_id_seq'), primary_key=True)
    name = db.Column(db.String(32), nullable=False)
    surnames = db.Column(db.String(64), nullable=False)
    birthday = db.Column(db.Date(), nullable=False)


class EditionParticipant(db.Model):
    __tablename__ = "edition_participants"

    edition_id = db.Column(
        db.Integer(), db.ForeignKey(
            'editions.id', ondelete='CASCADE', onupdate='CASCADE'), primary_key=True)

    participant_id = db.Column(
        db.Integer(), db.ForeignKey(
            'participants.id', ondelete='CASCADE', onupdate='CASCADE'), primary_key=True)

    club_id = db.Column(
        db.Integer(), db.ForeignKey(
            'clubs.id', ondelete='CASCADE', onupdate='CASCADE'))

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


    @property
    def penalize(self):
        return self.penalized

    @penalize.setter
    def penalize(self, value: bool):
        self.penalized = value

    @property
    def desqualify(self):
        return self.desqualified
        
    @setter.desqualify
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
        
    @setter.not_arrive
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
        
    @setter.not_come_out
    def not_come_out(self, value: bool):
        if not value:
            self.not_came_out = False
            return

        self.desqualified = False
        self.not_arrived = False
        self.not_came_out = True
