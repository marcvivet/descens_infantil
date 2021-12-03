import sys
import os
import subprocess
import logging
import platform

from PyQt5 import QtCore, QtWidgets, QtGui, QtWebEngineWidgets
import socket

from appadmin.server import app, configure_logs
from appadmin.utils.localization_manager import LocalizationManager
from appadmin.utils.version import __version__ as version
from appadmin.utils.localization_manager import Singleton
from appadmin.utils.crypt import Crypt


QtWidgets.QApplication.setAttribute(QtCore.Qt.AA_EnableHighDpiScaling, True)
QtWidgets.QApplication.setAttribute(QtCore.Qt.AA_UseHighDpiPixmaps, True)


class Configuration(metaclass=Singleton):
    def __init__(self):
        self._locale = LocalizationManager(singleton=False)

        for folder in [
                'base', 'race', 'organizers', 'editions', 'clubs', 'statistics', 'users', 'roles']:

            curr_path = os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                'appadmin', 'interface', folder)

            if not os.path.exists(curr_path):
                curr_path = os.path.join(
                    os.path.dirname(os.path.abspath(__file__)),
                    'interface', folder)

            self._locale.add_bluprint_by_path(curr_path)

        if any(platform.win32_ver()):
            extenssion = 'ico'
        else:
            extenssion = 'png'

        icon_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            'appadmin', 'interface', 'base', 'static', 'images', 'favicon', f'icono_72_72.{extenssion}')

        if not os.path.exists(icon_path):
            icon_path = os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                'interface', 'base', 'static', 'images', 'favicon', f'icono_72_72.{extenssion}')

        self._icon = QtGui.QIcon(icon_path)
        self._assets_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'appadmin', 'assets')
        if not os.path.exists(self._assets_path):
            self._assets_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')

    @property
    def locale(self):
        return self._locale

    @property
    def icon(self):
        return self._icon

    @property
    def images_path(self):
        return os.path.join(self._assets_path, 'images')


class Console(QtWidgets.QDialog, logging.Handler):
    new_record_signal = QtCore.pyqtSignal(str)

    def __init__(self):
        QtWidgets.QDialog.__init__(self)
        logging.Handler.__init__(self)

        layout = QtWidgets.QVBoxLayout()
        self.setWindowIcon(Configuration().icon)

        pal = QtGui.QPalette()
        bgc = QtGui.QColor(0, 0, 0)
        pal.setColor(QtGui.QPalette.Base, bgc)
        textc = QtGui.QColor(0, 255, 0)
        pal.setColor(QtGui.QPalette.Text, textc)

        self.editor = QtWidgets.QTextEdit()
        self.editor.setPalette(pal)
        font = QtGui.QFont()
        font.setFamily("Verdana")
        font.setPixelSize(12)
        self.editor.setFont(font)
       
        layout.addWidget(self.editor)
        self.setLayout(layout)

        logging.getLogger().addHandler(self)
        logging.getLogger().setLevel(logging.DEBUG)
        self.setFormatter(logging.Formatter('[%(asctime)s][%(levelname)s] %(message)s'))

        self.resize(1280, 480)
        
        self.lines = []
        self.new_record_signal.connect(self.on_new_record)

    def emit(self, record):
        if record.msg.startswith('127.0.0.1'):
            record.msg = record.message[37:]

        color = 'white'
        if record.levelname == 'DEBUG':
            color = 'yellow'
        elif record.levelname == 'INFO':
            color = 'green'
        elif record.levelname == 'WARNING':
            color = 'pink'
        elif record.levelname == 'ERROR':
            color = 'red'
        elif record.levelname == 'FATAL':
            color = 'red'
        elif record.levelname == 'CRITICAL':
            color = 'red'

        record = f'<font color="{color}">{record.msg}</font><br />'

        if self.isVisible():
            self.new_record_signal.emit(record)
        else:
            self.on_new_record(record)

    def update_data(self):
        self.editor.setHtml('\n'.join(self.lines))
        cursor = self.editor.textCursor()        
        cursor.movePosition(QtGui.QTextCursor.End)
        self.editor.setTextCursor(cursor)
        self.editor.ensureCursorVisible()

    def on_new_record(self, record):
        self.lines.append(record)

        if len(self.lines) > 100:
            self.lines = self.lines[1:]

        if self.isVisible():
            self.update_data()

    def showEvent(self, event):
        super().showEvent(event)
        self.update_data()


class About(QtWidgets.QDialog):
    def __init__(self):
        super(About, self).__init__()

        config = Configuration()
        self.setWindowIcon(config.icon)

        self.setObjectName(f"{config.locale.base['about']}")
        self.resize(400, 219)
        self.buttonBox = QtWidgets.QDialogButtonBox(self)
        self.buttonBox.setGeometry(QtCore.QRect(10, 185, 81, 31))
        self.buttonBox.setOrientation(QtCore.Qt.Horizontal)
        self.buttonBox.setStandardButtons(QtWidgets.QDialogButtonBox.Close)
        self.buttonBox.setObjectName("buttonBox")
        self.textBrowser = QtWidgets.QTextBrowser(self)
        self.textBrowser.setGeometry(QtCore.QRect(10, 10, 381, 171))
        self.textBrowser.setObjectName("textBrowser")

        #self.retranslateUi(self)
        self.buttonBox.rejected.connect(self.reject)
        self.buttonBox.accepted.connect(self.accept)
        QtCore.QMetaObject.connectSlotsByName(self)

        self.textBrowser.setHtml("<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0//EN\" \"http://www.w3.org/TR/REC-html40/strict.dtd\">\n"
"<html><head><meta name=\"qrichtext\" content=\"1\" /><style type=\"text/css\">\n"
"p, li { white-space: pre-wrap; }\n"
"</style></head><body style=\" background-color: white; font-family:\'Ubuntu\'; color:black; font-size:11pt; font-weight:400; font-style:normal;\">\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><span style=\" font-size:14pt; font-weight:600;\">Descens Infantil</span></p>\n"
"<p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px; font-size:14pt; font-weight:600;\"><br /></p>\n"
f"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">{config.locale.base['version']}: {version}</p>\n"
"<p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><br /></p>\n"
f"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">{config.locale.base['copyright']}</p>\n"
"<p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><br /></p>\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">Marc Vivet</p>\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">marc.vivet@gmail.com</p></body></html>")


class ApplicationThread(QtCore.QThread):
    def __init__(self, application, port=5000):
        super(ApplicationThread, self).__init__()
        self.application = application
        self.port = port


    def __del__(self):
        self.wait()

    def run(self):
        self.application.run(port=self.port, threaded=True)


class WebPage(QtWebEngineWidgets.QWebEnginePage):
    def __init__(self, root_url):
        super(WebPage, self).__init__()
        #
        
        self.root_url = root_url
        self.profile().downloadRequested.connect(self.on_downloadRequested)

    @QtCore.pyqtSlot(QtWebEngineWidgets.QWebEngineDownloadItem)
    def on_downloadRequested(self, download):
        old_path = download.path()
        suffix = QtCore.QFileInfo(old_path).suffix()
        path, _ = QtWidgets.QFileDialog.getSaveFileName(
            self.view(), "Save File", old_path, "*."+suffix)
        if path:
            download.setPath(path)
            download.accept()
            self.path = path
            download.finished.connect(self.open_file)

    def open_file(self):
        try:
            if platform.system() == 'Darwin':       # macOS
                subprocess.call(('open', self.path))
            elif platform.system() == 'Windows':    # Windows
                os.startfile(self.path)
            else:                                   # linux variants
                subprocess.call(('xdg-open', self.path))
        except:
            pass

    def home(self):
        self.load(QtCore.QUrl(self.root_url))

    def setPage(self, page):
        self.load(QtCore.QUrl(self.root_url + page))

    def acceptNavigationRequest(self, url, kind, is_main_frame):
        """Open external links in browser and internal links in the webview"""
        ready_url = url.toEncoded().data().decode()
        is_clicked = kind == self.NavigationTypeLinkClicked
        if is_clicked and self.root_url not in ready_url:
            QtGui.QDesktopServices.openUrl(url)
            return False
        return super(WebPage, self).acceptNavigationRequest(url, kind, is_main_frame)


class Window(QtWidgets.QMainWindow):
    
    def __init__(self, console):
        super().__init__()
        config = Configuration()
        self.about = About()
        self.console = console

        self.locale = config.locale      

        self.title = 'Descens Infantil'
        self.left = 100
        self.top = 100
        self.width = 1280
        self.height = 1024

        self.setWindowIcon(config.icon)

        self.setWindowTitle(self.title)
        self.setGeometry(self.left, self.top, self.width, self.height)

        self.prev_page_values = 'not set'
       
    def create_menu(self, page):
        self.menubar = self.menuBar()
        #mainMenu.setNativeMenuBar(False)     
        def open_di():
            QtGui.QDesktopServices.openUrl(QtCore.QUrl('http://www.descensinfantil.cat/'))

        def open_page(path):
            def open_page_aux():
                page.setPage(path)
            return open_page_aux

        def create_menu_item(name, icon, action, shortcut = None):
            button = QtWidgets.QAction(
                QtGui.QIcon(os.path.join(Configuration().images_path, icon)),
                f' &{name}', self)
            button.setStatusTip(name)
            button.triggered.connect(action)

            if shortcut:
                button.setShortcut(shortcut)

            return button

        self.menu_bar_items = {
            'file': self.menubar.addMenu(f'&{self.locale.base["file"]}'),
            'race': self.menubar.addMenu(f'&{self.locale.race["race"]}'),
            'organizers': self.menubar.addMenu(f'&{self.locale.organizers["organizers"]}'),
            'editions': self.menubar.addMenu(f'&{self.locale.editions["editions"]}'),
            'clubs': self.menubar.addMenu(f'&{self.locale.clubs["clubs"]}'),
            'statistics': self.menubar.addMenu(f'&{self.locale.statistics["statistics"]}'),
            'users': self.menubar.addMenu(f'&{self.locale.users["users"]}'),
            'roles': self.menubar.addMenu(f'&{self.locale.roles["roles"]}'),
            'help': self.menubar.addMenu(f'&{self.locale.base["help"]}')
        }

        self.menu_bar_items['file'].addAction(create_menu_item(
            self.locale.base["home"], 'fa-home.png', open_page('/')))
        self.menu_bar_items['file'].addAction(create_menu_item(
            self.locale.base["logout"], 'fa-sign-out.png', open_page('/logout')))
        self.menu_bar_items['file'].addSeparator()
        self.menu_bar_items['file'].addAction(create_menu_item(
            self.locale.base["log"], 'fa-terminal.png', self.console.show))
        self.menu_bar_items['file'].addSeparator()
        self.menu_bar_items['file'].addAction(create_menu_item(
            self.locale.base["exit"], 'fa-power-off.png', self.close, shortcut='Ctrl+Q'))

        self.menu_bar_items['race'].addAction(create_menu_item(
            self.locale.race["enter_times"], 'fa-dashboard.png', open_page('/race/enter_times')))
        self.menu_bar_items['race'].addAction(create_menu_item(
            self.locale.race["edit_participants"], 'fa-pencil-square-o.png',
            open_page('/race/edit_participants')))
        self.menu_bar_items['race'].addAction(create_menu_item(
            self.locale.race["add_participants"], 'fa-address-card-o.png', open_page('/race/add')))
        self.menu_bar_items['race'].addAction(create_menu_item(
            self.locale.race["results"], 'fa-trophy.png', open_page('/race/results')))
        self.menu_bar_items['race'].addSeparator()
        self.menu_bar_items['race'].addAction(create_menu_item(
            self.locale.race["list_bib_number"], 'fa-file-pdf-o.png',
            open_page('/race/list_bib_number')))
        self.menu_bar_items['race'].addAction(create_menu_item(
            self.locale.race["list_out"], 'fa-file-pdf-o.png', open_page('/race/list_out')))
        self.menu_bar_items['race'].addAction(create_menu_item(
            self.locale.race["list_results"], 'fa-file-pdf-o.png', open_page('/race/list_results')))
        self.menu_bar_items['race'].menuAction().setVisible(False)

        self.menu_bar_items['organizers'].addAction(create_menu_item(
            self.locale.organizers["view_organizers"], 'fa-sitemap.png',
            open_page('/organizers/view')))
        self.menu_bar_items['organizers'].addAction(create_menu_item(
            self.locale.organizers["add_organizer"], 'fa-address-book-o.png',
            open_page('/organizers/add')))
        self.menu_bar_items['organizers'].menuAction().setVisible(False)

        self.menu_bar_items['editions'].addAction(create_menu_item(
            self.locale.editions["view_editions"], 'fa-calendar.png', open_page('/editions/view')))
        self.menu_bar_items['editions'].addAction(create_menu_item(
            self.locale.editions["add_edition"], 'fa-calendar-plus-o.png',
            open_page('/editions/add')))
        self.menu_bar_items['editions'].menuAction().setVisible(False)

        self.menu_bar_items['clubs'].addAction(create_menu_item(
            self.locale.clubs["view_clubs"], 'fa-institution.png', open_page('/clubs/view')))
        self.menu_bar_items['clubs'].addAction(create_menu_item(
            self.locale.clubs["add_club"], 'fa-plus-square-o.png', open_page('/clubs/add')))
        self.menu_bar_items['clubs'].menuAction().setVisible(False)

        self.menu_bar_items['statistics'].addAction(create_menu_item(
            self.locale.statistics["organizers"], 'fa-pie-chart.png',
            open_page('/statistics/organizers')))
        self.menu_bar_items['statistics'].addAction(create_menu_item(
            self.locale.statistics["editions"], 'fa-bar-chart-o.png',
            open_page('/statistics/editions')))
        self.menu_bar_items['statistics'].menuAction().setVisible(False)

        self.menu_bar_items['users'].addAction(create_menu_item(
            self.locale.users["users"], 'fa-users.png', open_page('/users/view')))
        self.menu_bar_items['users'].addAction(create_menu_item(
            self.locale.users["add_user"], 'fa-user-plus.png', open_page('/users/add')))
        self.menu_bar_items['users'].menuAction().setVisible(False)

        self.menu_bar_items['roles'].addAction(create_menu_item(
            self.locale.roles["view_roles"], 'fa-unlock-alt.png', open_page('/roles/view')))
        self.menu_bar_items['roles'].addAction(create_menu_item(
            self.locale.roles["add_new_role"], 'fa-plus-square-o.png', open_page('/roles/add')))
        self.menu_bar_items['roles'].menuAction().setVisible(False)

        self.menu_bar_items['help'].addAction(create_menu_item(
            self.locale.base["open_web"], 'fa-snowflake-o.png', open_di))
        self.menu_bar_items['help'].addAction(create_menu_item(
            self.locale.base["about"], 'fa-question-circle-o.png', self.about.show))

    def update_menu(self, web_view):
        def update_menu_wrapper():
            def func_html(html):
                values = html.split('-->', 1)[0][4:]
                if values == self.prev_page_values:
                    return

                pages_str = Crypt().decrypt(values)

                if pages_str:
                    pages = pages_str.split(':')
                    for page in [
                            'race', 'organizers', 'editions', 'clubs', 'statistics', 'users', 'roles']:
                        self.menu_bar_items[page].menuAction().setVisible(page in pages)

            web_view.page().toHtml(func_html)
        return update_menu_wrapper


def init_gui(qtapp, application, port=0, argv=None):
    if argv is None:
        argv = sys.argv

    if port == 0:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.bind(('localhost', 0))
        port = sock.getsockname()[1]
        sock.close()

    QtCore.QCoreApplication.setApplicationName('descens infantil')
    QtCore.QCoreApplication.setApplicationVersion(version)
    QtCore.QCoreApplication.setOrganizationName('Descens Infantil')
    QtCore.QCoreApplication.setOrganizationDomain('www.descensinfantil.cat')

    console = Console()

    webapp = ApplicationThread(application, port)
    webapp.start()
    qtapp.aboutToQuit.connect(webapp.terminate)

    window = Window(console)

    # WebPage Level
    page = WebPage('http://localhost:{}'.format(port))
    page.home()

    # WebView Level
    webView = QtWebEngineWidgets.QWebEngineView(window)
    webView.loadFinished.connect(window.update_menu(webView))
    window.setCentralWidget(webView)
    webView.setPage(page)
    window.create_menu(page)

    window.show()
    return qtapp.exec_()


if __name__ == '__main__':
    with open('log.txt', 'w') as stdout, open('err.txt', 'w') as stderr:
        sys.stdout = stdout
        sys.stderr = stderr

        configure_logs(app)
        qtapp = QtWidgets.QApplication(sys.argv)
        qtapp.setWindowIcon(Configuration().icon)
        init_gui(qtapp, app)
