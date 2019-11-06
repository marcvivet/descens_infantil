# -*- mode: python -*-

import os
import sys
from PyInstaller.building.build_main import Analysis, PYZ, EXE, COLLECT, BUNDLE, TOC

def collect_pkg_data(package, include_py_files=False, subdir=None):
    import os
    from PyInstaller.utils.hooks import get_package_paths, remove_prefix, PY_IGNORE_EXTENSIONS

    # Accept only strings as packages.
    if type(package) is not str:
        raise ValueError

    pkg_base, pkg_dir = get_package_paths(package)
    if subdir:
        pkg_dir = os.path.join(pkg_dir, subdir)
    # Walk through all file in the given package, looking for data files.
    data_toc = TOC()
    for dir_path, dir_names, files in os.walk(pkg_dir):
        for f in files:
            extension = os.path.splitext(f)[1]
            if include_py_files or (extension not in PY_IGNORE_EXTENSIONS):
                source_file = os.path.join(dir_path, f)
                dest_folder = remove_prefix(dir_path, os.path.dirname(pkg_base) + os.sep)
                dest_file = os.path.join(dest_folder, f)
                data_toc.append((dest_file, source_file, 'DATA'))

    return data_toc

sys.path.append(os.path.join(os.getcwd(), 'pyapp'))
pkg_data = collect_pkg_data('appadmin', include_py_files=True)

block_cipher = None

print(f'Working Directory: {os.getcwd()}')

a = Analysis(
    ['pyapp/appadmin/server_gui.py'],
    pathex=[os.getcwd()],
    binaries=[],
    datas=[],
    hiddenimports=['PIL', 'PIL._imagingtk', 'PIL._tkinter_finder', 'PIL.Image', 'requests', 'pdfkit', 'PyQt5', 'sip', 'PyQt5.QtWebEngineWidgets'], # , 'PyQtWebEngine'],
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
    console=True)

collect = COLLECT(
    exe,
    a.scripts,
    a.binaries,
    a.zipfiles,
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
