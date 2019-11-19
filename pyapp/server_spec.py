# -*- mode: python -*-

import os
import sys
import glob
from PyInstaller.__main__ import run
from PyInstaller.building.build_main import Analysis, PYZ, EXE, COLLECT, BUNDLE, TOC, MERGE
from PyInstaller.config import CONF
from PyInstaller import compat
from PyInstaller import HOMEPATH, DEFAULT_DISTPATH, DEFAULT_WORKPATH
from PyInstaller.building.datastruct import TOC, Target, Tree, _check_guts_eq
import PyInstaller.log as logging
from PyInstaller.archive import pyz_crypto



IGNORE_EXTENSIONS = {'.py', '.pyo', '.pyc'}


def _old_api_error(obj_name):
    """
    Cause PyInstall to exit when .spec file uses old api.
    :param obj_name: Name of the old api that is no longer suppored.
    """
    raise SystemExit('%s has been removed in PyInstaller 2.0. '
                     'Please update your spec-file. See '
                     'http://www.pyinstaller.org/wiki/MigrateTo2.0 '
                     'for details' % obj_name)

def build(spec, distpath, workpath, clean_build):
    """
    Build the executable according to the created SPEC file.
    """

    # For combatibility with Python < 2.7.9 we can not use `lambda`,
    # but need to declare _old_api_error as beeing global, see issue #1408
    def TkPKG(*args, **kwargs):
        global _old_api_error
        _old_api_error('TkPKG')

    def TkTree(*args, **kwargs):
        global _old_api_error
        _old_api_error('TkTree')

    # Ensure starting tilde and environment variables get expanded in distpath / workpath.
    # '~/path/abc', '${env_var_name}/path/abc/def'
    distpath = compat.expand_path(distpath)
    workpath = compat.expand_path(workpath)
    CONF['spec'] = compat.expand_path(spec)

    CONF['specpath'], CONF['specnm'] = os.path.split(spec)
    CONF['specnm'] = os.path.splitext(CONF['specnm'])[0]

    # Add 'specname' to workpath and distpath if they point to PyInstaller homepath.
    if os.path.dirname(distpath) == HOMEPATH:
        distpath = os.path.join(HOMEPATH, CONF['specnm'], os.path.basename(distpath))
    CONF['distpath'] = distpath
    if os.path.dirname(workpath) == HOMEPATH:
        workpath = os.path.join(HOMEPATH, CONF['specnm'], os.path.basename(workpath), CONF['specnm'])
    else:
        workpath = os.path.join(workpath, CONF['specnm'])

    CONF['warnfile'] = os.path.join(workpath, 'warn-%s.txt' % CONF['specnm'])
    CONF['dot-file'] = os.path.join(workpath, 'graph-%s.dot' % CONF['specnm'])
    CONF['xref-file'] = os.path.join(workpath, 'xref-%s.html' % CONF['specnm'])

    # Clean PyInstaller cache (CONF['cachedir']) and temporary files (workpath)
    # to be able start a clean build.
    if clean_build:
        logger.info('Removing temporary files and cleaning cache in %s', CONF['cachedir'])
        for pth in (CONF['cachedir'], workpath):
            if os.path.exists(pth):
                # Remove all files in 'pth'.
                for f in glob.glob(pth + '/*'):
                    # Remove dirs recursively.
                    if os.path.isdir(f):
                        shutil.rmtree(f)
                    else:
                        os.remove(f)

    # Create DISTPATH and workpath if they does not exist.
    for pth in (CONF['distpath'], workpath):
        if not os.path.exists(pth):
            os.makedirs(pth)

    # Construct NAMESPACE for running the Python code from .SPEC file.
    # NOTE: Passing NAMESPACE allows to avoid having global variables in this
    #       module and makes isolated environment for running tests.
    # NOTE: Defining NAMESPACE allows to map any class to a apecific name for .SPEC.
    # FIXME: Some symbols might be missing. Add them if there are some failures.
    # TODO: What from this .spec API is deprecated and could be removed?
    spec_namespace = {
        # Set of global variables that can be used while processing .spec file.
        # Some of them act as configuration options.
        'DISTPATH': CONF['distpath'],
        'HOMEPATH': HOMEPATH,
        'SPEC': CONF['spec'],
        'specnm': CONF['specnm'],
        'SPECPATH': CONF['specpath'],
        'WARNFILE': CONF['warnfile'],
        'workpath': workpath,
        # PyInstaller classes for .spec.
        'TOC': TOC,
        'Analysis': Analysis,
        'BUNDLE': BUNDLE,
        'COLLECT': COLLECT,
        'EXE': EXE,
        'MERGE': MERGE,
        'PYZ': PYZ,
        'Tree': Tree,
        # Old classes for .spec - raise Exception for user.
        'TkPKG': TkPKG,
        'TkTree': TkTree,
        # Python modules available for .spec.
        'os': os,
        'pyi_crypto': pyz_crypto,
    }

    # Set up module PyInstaller.config for passing some arguments to 'exec'
    # function.
    CONF['workpath'] = workpath

    # Execute the specfile. Read it as a binary file...
    #with open(spec, 'rU' if is_py2 else 'rb') as f:
        # ... then let Python determine the encoding, since ``compile`` accepts
        # byte strings.
    #    code = compile(f.read(), spec, 'exec')
    #exec(code, spec_namespace)



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
        if 'vendors' in dir_path:
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


run()


pyapp_path = os.path.join(os.getcwd())
if 'pyapp' not in pyapp_path:
    pyapp_path = os.path.join(pyapp_path, 'pyapp')

if not os.path.exists(pyapp_path):
    pyapp_path = os.path.join(os.path.dirname(os.path.abspath(__file__)))

    if 'pyapp' not in pyapp_path:
        pyapp_path = os.path.join(pyapp_path, 'pyapp')

build('', os.path.join(pyapp_path, 'pyappdist'), pyapp_path, False)

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
    #a.scripts,
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
