import os
import sys
from datetime import datetime

from datetime import date, time, datetime
from sqlalchemy import and_, orm
from sqlalchemy.exc import IntegrityError
import pandas as pd


sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from appadmin.models.descens_infantil_model import db as dbd, Club, Edition, Participant, EditionParticipant, Organizer
from appadmin.models.interface_model import db as dbi, User, Role, Page, Language
from appadmin.utils.db_manager import DBManager


def main():
    base_path = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    data_folder = os.path.join(base_path, 'extract')
    image_folder = os.path.join(
        base_path, 'pyapp', 'appadmin', 'interface', 'base', 'static', 'images')
    club_image_folder = os.path.join(image_folder, 'clubs')
    edition_image_folder = os.path.join(image_folder, 'editions')

    manager = DBManager(data_base_name='descens_infantil')

    clubs = pd.read_csv(os.path.join(base_path, "pyapp", "scripts", "clubs.csv"), sep=";").set_index("ID")
    inscrits = pd.read_excel(os.path.join(base_path, "pyapp", "scripts", "Inscripcions_DescensInfantil.xlsx")).sort_values(by='Data naixement', ascending=False)

    last_ed = manager.query(Edition).order_by(Edition.edition.desc()).all()[0]
    new_edition = Edition(
        edition=last_ed.edition + 1, date=date(datetime.now().year + 1, 1, 1))

    manager.add(new_edition)
    manager.commit()

    for bib_number, (_, row) in enumerate(inscrits.iterrows(), start=1):
        birthday = row['Data naixement'].date()
        try:
            name = row['Nom'].title()
        except:
            name = " "

        participant = manager.query(Participant).filter(
            Participant.hash == Participant.get_hash(
                name, row['Cognoms'].title(), birthday)).first()

        if not participant:
            participant = Participant(name, row['Cognoms'].title(), birthday)
            manager.add(participant)
            manager.flush()

        edition_participant = manager.query(EditionParticipant).filter(and_(
            EditionParticipant.participant_id == participant.id,
            EditionParticipant.edition_id == new_edition.id)).first()

        if edition_participant:
            raise Exception('participant_exists')

        club_data = clubs.loc[row["Club"]].to_dict()

        club = manager.query(Club).filter(
            Club.name == club_data['Nom'].title()).first()

        if not club:
            club = Club(name=club_data['Nom'].title(), acronym=row['Club'].upper())

            while manager.query(Club).filter(
                    Club.acronym == club.acronym).first():
                club.acronym += '*'

            manager.add(club)
            manager.flush()

        edition_participant = EditionParticipant(
            new_edition, participant, club, bib_number)

        manager.add(edition_participant)
        manager.commit()
    manager.close()


if __name__ == '__main__':
    main()
