import os
import sys
import csv
from datetime import date, time, datetime
from sqlalchemy import and_, orm
from sqlalchemy.exc import IntegrityError

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from appadmin.models.descens_infantil_model import db as dbd, Club, Edition, Participant, EditionParticipant
from appadmin.models.interface_model import db as dbi, User, Role, Page, Language
from appadmin.utils.db_manager import DBManager


def main():
    data_folder = '/home/marc/local.x86_64/src/descens_infantil/extract/data'
    club_image_folder = '/home/marc/local.x86_64/src/descens_infantil/app/pyapp/appadmin/interface/base/static/images/clubs'

    manager = DBManager(clean=True)
    manager.create_all(dbd.Model)
    manager.create_all(dbi.Model)


    with open(os.path.join(data_folder, 'CLUBS.csv'), newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            logo = None
            if os.path.exists(os.path.join(club_image_folder, f"{row['CLUB'].upper()}.jpg")):
                logo = f"{row['CLUB'].upper()}.jpg"

            club = Club(id=int(row['ID_CLUB']), club=row['CLUB'], name=row['NOM'], logo=logo)
            manager.add(club)
            manager.commit()


    with open(os.path.join(data_folder, 'EDICIÓ.csv'), newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            edition = Edition(
                edition=int(row['EDICIÓ']), chief_of_course=row['Director de la cursa'],
                start_referee=row['Director de la cursa02'], date=date(int(row['ANY']), 1, 1))
            
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
                penalized=row['PENALITZACIÓ'] == 1,
                desqualified=row['DSQ'] == 1,
                not_arrived=row['DNF'] == 1,
                not_come_out=row['DNS'] == 1,
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
        user_role = Role('User')

        # Adding Default users
        user = User(
            'marc', name='Marc', surname='Vivet', email='marc.vivet@gmail.com', active=True,
            picture='/static/images/users/marc.jpg')

        user.roles.append(admin_role)
        user.roles.append(user_role)
        user.language = catala

        manager.add(user)

        user = User(
            'xenia', name='Xènia', surname='Torras', email='descensinfantil@gmail.com', active=True,
            picture='/static/images/users/xenia.jpg')

        user.roles.append(admin_role)
        user.roles.append(user_role)
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
        page.roles.append(admin_role)
        manager.add(page)
        manager.commit()

    except Exception as e:
        print('Exception: {}'.format(e))
        pass
    

if __name__ == '__main__':
    main()
