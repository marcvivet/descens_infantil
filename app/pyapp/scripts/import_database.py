import os
import sys
import csv
from datetime import date, time, datetime
from sqlalchemy import and_, orm
from sqlalchemy.exc import IntegrityError

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from appadmin.models.descens_infantil_model import db as dbd, Club, Edition, Participant, EditionParticipant, Organizer
from appadmin.models.interface_model import db as dbi, User, Role, Page, Language
from appadmin.utils.db_manager import DBManager


def main():
    data_folder = '/home/marc/local.x86_64/src/descens_infantil/extract/data'
    image_folder = '/home/marc/local.x86_64/src/descens_infantil/app/pyapp/appadmin/interface/base/static/images'
    club_image_folder = os.path.join(image_folder, 'clubs')
    edition_image_folder = os.path.join(image_folder, 'editions')

    manager = DBManager(clean=True)
    manager.create_all(dbd.Model)
    manager.create_all(dbi.Model)

    with open(os.path.join(data_folder, 'CLUBS.csv'), newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            emblem = None
            if os.path.exists(os.path.join(club_image_folder, f"{row['CLUB'].upper()}.jpg")):
                emblem = f"/static/images/clubs/{row['CLUB'].upper()}.jpg"

            club = Club(id=int(row['ID_CLUB']), acronym=row['CLUB'], name=row['NOM'], emblem=emblem)
            manager.add(club)
            manager.commit()


    with open(os.path.join(data_folder, 'EDICIÓ.csv'), newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            picture = None
            if os.path.exists(os.path.join(edition_image_folder, f"{row['ANY'].upper()}.jpg")):
                picture = f"/static/images/editions/{row['ANY'].upper()}.jpg"

            chief_of_course = None
            if row['Director de la cursa']:
                hash_chief_of_course = Organizer.create_hash(*row['Director de la cursa'].split(' ', 1))
                chief_of_course = manager.query(Organizer).filter(
                    Organizer.hash == hash_chief_of_course).first()
                if not chief_of_course:
                    chief_of_course = Organizer(*row['Director de la cursa'].split(' ', 1))
                    manager.add(chief_of_course)
                    manager.flush()

            start_referee = None
            if row['Director de la cursa02']:
                hash_start_referee = Organizer.create_hash(*row['Director de la cursa02'].split(' ', 1))
                start_referee = manager.query(
                    Organizer).filter(Organizer.hash == hash_start_referee).first()
                if not start_referee:
                    start_referee = Organizer(*row['Director de la cursa02'].split(' ', 1))
                    manager.add(start_referee)
                    manager.flush()

            edition = Edition(
                edition=int(row['EDICIÓ']), chief_of_course=chief_of_course,
                start_referee=start_referee, date=date(int(row['ANY']), 1, 1), picture=picture)
            
            manager.add(edition)
            manager.commit()

    with open(os.path.join(data_folder, 'COMPETICIÓ.csv'), newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            club = manager.query(Club).filter(Club.id == row['CLUB']).one()
            edition = manager.query(Edition).filter(Edition.date == date(int(row['ANY']), 1, 1)).one()

            try:
                name = row['NOM'].title()
                surnames = row['COGNOMS'].title()

                if not row['DATA NAIXEMENT']:
                    year = int(row['ANY'])
                    category = int(row['CATEGORIA'])
                    birthday = date(year - category, 1, 1)
                else:
                    birthday = datetime.strptime(row['DATA NAIXEMENT'], '%m/%d/%y %H:%M:%S').date()
            except:
                print('ERROR')

            participant = Participant(name=name, surnames=surnames, birthday=birthday)

            if manager.query(Participant).filter(Participant.hash == participant.hash).count():
                participant = manager.query(Participant).filter(Participant.hash == participant.hash).one()
            else:
                manager.add(participant)
                manager.commit()

            minutes = 0 if not row['MIN'] else int(float(row['MIN']))
            seconds = 0 if not row['SEG'] else int(float(row['SEG']))
            macroseconds = 0 if not row['CENT'] else int(float(row['CENT'])) * 10000

            edition_participant = EditionParticipant(
                edition,
                participant,
                club,
                bib_number=int(row['DORSAL']),
                penalized=row['PENALITZACIÓ'] == '1',
                disqualified=row['DSQ'] == '1',
                not_arrived=row['DNF'] == '1',
                not_came_out=row['DNS'] == '1',
                time=time(0, minutes, seconds, macroseconds)
            )

            try:
                manager.add(edition_participant)
            except:
                # print(club)
                # print(edition)
                print(f' Error: {participant}')

    try:
        for lang_data in Language.LANGUAGES:
            language = Language(**lang_data)
            manager.add(language)
            manager.commit()

            if language.name == "Català":
                catala = language

        admin_role = Role('Admin')
        developer_role = Role(
            'Developer', description='Adds GUI templates to the interface (for development only)')
        
        user_role = Role('User')

        # Adding Default users
        user = User(
            'marc', name='Marc', surname='Vivet', email='marc.vivet@gmail.com', active=True,
            picture='/static/images/users/marc.jpg')

        user.roles.append(admin_role)
        user.roles.append(developer_role)
        user.language = catala

        manager.add(user)

        user = User(
            'xenia', name='Xènia', surname='Torras', email='descensinfantil@gmail.com', active=True,
            picture='/static/images/users/xenia.jpg')

        user.roles.append(admin_role)
        user.language = catala

        manager.add(user)

        user = User(
            'test', name='Test', surname='User', active=True)

        user.roles.append(user_role)
        user.language = catala
        manager.add(user)
        manager.commit()

        page = Page(
            'templates', description='GUI templates (for development only)')
        page.roles.append(developer_role)
        manager.add(page)
        manager.commit()

    except Exception as e:
        print('Exception: {}'.format(e))
        pass
    

if __name__ == '__main__':
    main()
