# -*- mode: python -*-

import os
import sys
import re
from PyInstaller.building.build_main import Analysis, PYZ, EXE, COLLECT, BUNDLE, TOC

IGNORE_EXTENSIONS = {'.py', '.pyo', '.pyc', '.dll', '.exe'}

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

    find_path = re.compile(
        r".*\{+ +url_for *\(['|\"].*['|\"], *filename *= *['|\"](?P<path>.*)['|\"] *\) *\}+.*")

    resources = set()
    for dir_path, dir_names, files in os.walk(pkg_dir):

        if '__pycache__' in dir_path:
            continue
        if '__deprecated' in dir_path:
            continue
        if '__templates' in dir_path:
            continue
        if 'vendors' in dir_path:
            continue

        for file_name in files:
            extenssion = os.path.splitext(file_name)[1]
            if extenssion == '.html':
                source_file = os.path.join(dir_path, file_name)
                with open(source_file, 'r', encoding='utf-8') as file_r:
                    file_data = file_r.read()

                path_data = find_path.findall(file_data)

                if not path_data:
                    continue

                for path_found in path_data:
                    if path_found.startswith('vendors'):
                        path_found = path_found.replace('\\', '/')
                        resources.add(os.path.join(pkg_dir, 'interface', 'base', 'static', path_found).replace('\\', '/'))

                        if not path_found.endswith('.css'):
                            continue

                        name_lib = path_found.split('/')[1]
                        for dir_path_vendor, dir_names_vendor, files_vendor in os.walk(
                            os.path.join(pkg_dir, 'interface', 'base', 'static', 'vendors', name_lib)):

                            for file_name_vendor in files_vendor:
                                extenssion = os.path.splitext(file_name_vendor)[1]
                                if extenssion in {'.ttf'}:
                                    source_file = os.path.join(dir_path_vendor, file_name_vendor).replace('\\', '/')
                                    resources.add(source_file)
                                    print(source_file)

    
    for dir_path, dir_names, files in os.walk(pkg_dir):
        if '__pycache__' in dir_path:
            continue
        if '__deprecated' in dir_path:
            continue
        if '__templates' in dir_path:
            continue
        for f in files:
            extension = os.path.splitext(f)[1]
            if extension in IGNORE_EXTENSIONS:
                continue

            source_file = os.path.join(dir_path, f).replace('\\', '/')
            if 'vendors' in source_file:
                if source_file not in resources:
                    continue

            if include_py_files or (extension not in PY_IGNORE_EXTENSIONS) or extension not in IGNORE_EXTENSIONS:
                
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
        if '__pycache__' in dir_path:
            continue
        if '__deprecated' in dir_path:
            continue
        if '__templates' in dir_path:
            continue
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
        if '__pycache__' in dir_path:
            continue
        if '__deprecated' in dir_path:
            continue
        #if '__templates' in dir_path:
        #    continue
        for f in files:
            extension = os.path.splitext(f)[1]
            if extension in {'.dll', '.exe'}:
                source_file = os.path.join(dir_path, f)
                data_toc.append((f, source_file, 'DATA'))

    return data_toc


pyapp_path = os.getcwd()

if not os.path.exists(pyapp_path):
    pyapp_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pyapp')

sys.path.append(pyapp_path)
pkg_data = collect_pkg_data('appadmin', include_py_files=True)
pkg_data_py = collect_pkg_python('appadmin')
pkg_data_bin = collect_pkg_bin('appadmin')

block_cipher = None

print(f'Working Directory: {pyapp_path}')

a = Analysis(
    ['appadmin/server_gui.py'],
    pathex=[pyapp_path],
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
    console=False,
    icon=os.path.join(pyapp_path, 'appadmin', 'interface', 'base', 'static', 'images', 'favicon', 'icono_72_72.ico'))

collect = COLLECT(
    exe,
    #a.scripts,
    a.binaries,
    #a.zipfiles,
    pkg_data_bin,
    a.datas,
    pkg_data,
    name='di',
    debug=False,
    strip=None,
    upx=False,
    runtime_tmpdir=None,
    console=True)

"""
app = BUNDLE(exe,
    name='myscript.app',
    icon=None,
    bundle_identifier=None)
"""
