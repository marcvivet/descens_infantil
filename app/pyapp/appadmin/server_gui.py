import sys
import os
import subprocess
import platform
from PyQt5 import QtCore, QtWidgets, QtGui, QtWebEngineWidgets
import socket

from appadmin.server import app, configure_logs


class About(QtWidgets.QDialog):
    def __init__(self):
        super(About, self).__init__()
        self.setObjectName("About")
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
"</style></head><body style=\" font-family:\'Ubuntu\'; font-size:11pt; font-weight:400; font-style:normal;\">\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><span style=\" font-size:14pt; font-weight:600;\">Descens Infantil</span></p>\n"
"<p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px; font-size:14pt; font-weight:600;\"><br /></p>\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">Version: 1.0b</p>\n"
"<p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><br /></p>\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">Copyright 2019 by Descens Infantil. All rights reserved.</p>\n"
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
        path, _ = QtWidgets.QFileDialog.getSaveFileName(self.view(), "Save File", old_path, "*."+suffix)
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

        self.about = About()

        self.title = 'Descens Infantil'
        self.left = 100
        self.top = 100
        self.width = 1280
        self.height = 1024

        self.setWindowIcon(
            QtGui.QIcon(
                os.path.join(
                    os.path.dirname(os.path.abspath(__file__)),
                    'appadmin', 'interface', 'base', 'static', 'images', 'favicon', 'icono_72_72.ico')))
        
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

        helpMenu = self.menubar.addMenu('&Help')
        aboutButton = QtWidgets.QAction(QtGui.QIcon('exit24.png'), ' &About', self)
        aboutButton.setShortcut('Ctrl+A')
        aboutButton.setStatusTip('About ...')
        aboutButton.triggered.connect(self.about.show)
        helpMenu.addAction(aboutButton)

        #self.setMenuBar(mainMenu)
        
        # self.statusBar().showMessage('Ready')
        
        #self.setGeometry(300, 300, 800, 600)
        #self.setWindowTitle('Statusbar')    
        self.show()


def init_gui(qtapp, application, port=0, width=800, height=600,
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

    #qtapp.setApplicationName("di")

    sys.stdout = open('log.txt', 'w')
    sys.stderr = open('err.txt', 'w')

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
    qtapp = QtWidgets.QApplication(sys.argv)
    init_gui(qtapp, app)
