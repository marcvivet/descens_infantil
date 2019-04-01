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

    id = db.Column(db.Integer(), db.Sequence(
        'edition_participants_id_seq'), primary_key=True)

    edition_id = db.Column(
        db.Integer(), db.ForeignKey(
            'editions.id', ondelete='CASCADE', onupdate='CASCADE'))

    participant_id = db.Column(
        db.Integer(), db.ForeignKey(
            'participants.id', ondelete='CASCADE', onupdate='CASCADE'))

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

    __table_args__ = (
         db.UniqueConstraint('edition_id', 'participant_id', name='edition_participants_uc'),)
