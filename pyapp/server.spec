# -*- mode: python -*-

import os
import sys
from PyInstaller.building.build_main import Analysis, PYZ, EXE, COLLECT, BUNDLE, TOC

IGNORE_EXTENSIONS = {'.py', '.pyo', '.pyc'}

def collect_pkg_data(package):
    import os
    from PyInstaller.utils.hooks import get_package_paths, remove_prefix, PY_IGNORE_EXTENSIONS

    # Accept only strings as packages.
    if type(package) is not str:
        raise ValueError

    pkg_base, pkg_dir = get_package_paths(package)
    # Walk through all file in the given package, looking for data files.
    data_toc = TOC()
    for dir_path, dir_names, files in os.walk(pkg_dir):
        if '__pycache__' in dir_path:
            continue
        if '__deprecated' in dir_path:
            continue
        #if '__templates' in dir_path:
        #    continue
        for f in files:
            extension = os.path.splitext(f)[1]
            if (extension not in PY_IGNORE_EXTENSIONS) and extension not in IGNORE_EXTENSIONS:
                source_file = os.path.join(dir_path, f)
                dest_folder = remove_prefix(dir_path, os.path.dirname(pkg_base) + os.sep)
                dest_file = os.path.join(dest_folder, f)
                data_toc.append((dest_file, source_file, 'DATA'))

    return data_toc


def collect_pkg_python(package):
    import os
    from PyInstaller.utils.hooks import get_package_paths, remove_prefix, PY_IGNORE_EXTENSIONS

    # Accept only strings as packages.
    if type(package) is not str:
        raise ValueError

    pkg_base, pkg_dir = get_package_paths(package)
    # Walk through all file in the given package, looking for data files.
    data_toc = TOC()
    for dir_path, dir_names, files in os.walk(pkg_dir):
        for f in files:
            extension = os.path.splitext(f)[1]
            if extension == '.py':
                source_file = os.path.join(dir_path, f)
                dest_folder = remove_prefix(dir_path, os.path.dirname(pkg_base) + os.sep)
                dest_file = os.path.join(dest_folder, f)
                data_toc.append((dest_file, source_file, 'DATA'))

    return data_toc


def collect_pkg_bin(package):
    import os
    from PyInstaller.utils.hooks import get_package_paths, remove_prefix, PY_IGNORE_EXTENSIONS

    # Accept only strings as packages.
    if type(package) is not str:
        raise ValueError

    pkg_base, pkg_dir = get_package_paths(package)
    # Walk through all file in the given package, looking for data files.
    data_toc = TOC()
    for dir_path, dir_names, files in os.walk(pkg_dir):
        for f in files:
            extension = os.path.splitext(f)[1]
            if extension in {'.dll', '.exe'}:
                source_file = os.path.join(dir_path, f)
                data_toc.append((f, source_file, 'DATA'))

    return data_toc


pyapp_path = os.path.join(os.getcwd())

if not os.path.exists(pyapp_path):
    pyapp_path = os.path.join(os.path.dirname(os.path.abspath(__file__)))

sys.path.append(pyapp_path)
pkg_data = collect_pkg_data('appadmin')
pkg_data_py = collect_pkg_python('appadmin')
pkg_data_bin = collect_pkg_bin('appadmin')

block_cipher = None

print(f'Working Directory: {pyapp_path}')

a = Analysis(
    ['appadmin/server_gui.py'],
    pathex=[pyapp_path],
    binaries=[],
    datas=[],
    hiddenimports=['PIL', 'PIL._imagingtk', 'PIL._tkinter_finder', 'PIL.Image', 'requests', 'pdfkit', 'PyQt5', 'sip', 'PyQt5.QtWebEngineWidgets', 'PyQtWebEngine'],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    #cipher=block_cipher,
    cipher=None,
    noarchive=False
    )

pyz = PYZ(
    a.pure, a.zipped_data,
    #cipher=block_cipher,
    cipher=None
    )

exe = EXE(
    pyz,
    a.scripts,
    pkg_data_py,
    #pkg_data_py,
    #a.binaries,
    #a.zipfiles,
    #a.datas,
    #pkg_data,
    exclude_binaries=True,
    name='di',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    runtime_tmpdir=None,
    console=True,
    icon=os.path.join(pyapp_path, 'appadmin', 'interface', 'base', 'static', 'images', 'favicon', 'icono_72_72.ico'))

collect = COLLECT(
    exe,
    a.scripts,
    a.binaries,
    a.zipfiles,
    pkg_data_bin,
    a.datas,
    pkg_data,
    name='di',
    debug=False,
    strip=None,
    upx=False,
    runtime_tmpdir=None,
    console=True)

app = BUNDLE(exe,
    name='myscript.app',
    icon=None,
    bundle_identifier=None)
