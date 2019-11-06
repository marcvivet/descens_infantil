import sys
import os
import subprocess
import platform
from PyQt5 import QtCore, QtWidgets, QtGui, QtWebEngineWidgets
import socket

from appadmin.server import app, configure_logs


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
        path, _ = QtWidgets.QFileDialog.getSaveFileName(self.view(), "Save File", old_path, "*."+suffix)
        if path:
            download.setPath(path)
            download.accept()
            self.path = path
            download.finished.connect(self.open_file)

    def open_file(self):
        if platform.system() == 'Darwin':       # macOS
            subprocess.call(('open', self.path))
        elif platform.system() == 'Windows':    # Windows
            os.startfile(self.path)
        else:                                   # linux variants
            subprocess.call(('xdg-open', self.path))

    def home(self):
        self.load(QtCore.QUrl(self.root_url))

    def acceptNavigationRequest(self, url, kind, is_main_frame):
        """Open external links in browser and internal links in the webview"""
        ready_url = url.toEncoded().data().decode()
        is_clicked = kind == self.NavigationTypeLinkClicked
        if is_clicked and self.root_url not in ready_url:
            QtGui.QDesktopServices.openUrl(url)
            return False
        return super(WebPage, self).acceptNavigationRequest(url, kind, is_main_frame)


class Window(QtWidgets.QMainWindow):
    
    def __init__(self):
        super().__init__()

        self.title = 'Descens Infantil'
        self.left = 100
        self.top = 100
        self.width = 1280
        self.height = 1024
        
        self.initUI()
        
        
    def initUI(self):
        self.setWindowTitle(self.title)
        self.setGeometry(self.left, self.top, self.width, self.height)
        
        self.menubar = self.menuBar()
        #mainMenu.setNativeMenuBar(False)
        fileMenu = self.menubar.addMenu('&File')
        
        exitButton = QtWidgets.QAction(QtGui.QIcon('exit24.png'), ' &Exit', self)
        exitButton.setShortcut('Ctrl+Q')
        exitButton.setStatusTip('Exit application')
        exitButton.triggered.connect(self.close)
        fileMenu.addAction(exitButton)

        #self.setMenuBar(mainMenu)
        
        # self.statusBar().showMessage('Ready')
        
        #self.setGeometry(300, 300, 800, 600)
        #self.setWindowTitle('Statusbar')    
        self.show()


def init_gui(application, port=0, width=800, height=600,
             window_title="PyFladesk", icon="appicon.png", argv=None):
    if argv is None:
        argv = sys.argv

    if port == 0:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.bind(('localhost', 0))
        port = sock.getsockname()[1]
        sock.close()

    # Application Level

    QtCore.QCoreApplication.setApplicationName('descens infantil')
    QtCore.QCoreApplication.setApplicationVersion('1.0.0')
    QtCore.QCoreApplication.setOrganizationName('Descens Infantil')
    QtCore.QCoreApplication.setOrganizationDomain('www.descensinfantil.cat')

    qtapp = QtWidgets.QApplication(sys.argv)
    #qtapp.setApplicationName("di")

    webapp = ApplicationThread(application, port)
    webapp.start()
    qtapp.aboutToQuit.connect(webapp.terminate)

    # Main Window Level
    window = Window()
    #window.resize(width, height)
    #window.setWindowTitle(window_title)
    #window.setWindowIcon(QtGui.QIcon(icon))

    # WebView Level
    webView = QtWebEngineWidgets.QWebEngineView(window)
    window.setCentralWidget(webView)

    # WebPage Level
    page = WebPage('http://localhost:{}'.format(port))
    page.home()
    webView.setPage(page)

    window.show()
    return qtapp.exec_()


if __name__ == '__main__':
    configure_logs(app)
    init_gui(app)
