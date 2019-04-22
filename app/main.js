const {
    app,
    BrowserWindow,
    Menu,
    net
} = require('electron')
const shell = require('electron').shell;
const path = require('path');

let proc = startFlask();
let window = null;

function resizeWithAnimation(window, width, height) {
    let currentSize = window.getBounds();

    if (currentSize.width == width && currentSize.height == height)
        return;

    let newWidth = currentSize.width;
    let newHeight = currentSize.height;
    if (newWidth < width) {
        newWidth += 10;
    } else {
        newWidth = width;           
    }
    if (newHeight < height) {
        newHeight += 10;
    } else {
        newHeight = height;
    }

    window.setSize(newWidth, height);

    setTimeout(() => {
        resizeWithAnimation(window, width, height);
    }, 5);
}

function startFlask() {
    const guessPackaged = () => {
        const fullPath = path.join(__dirname, 'pyappdist')
        return require('fs').existsSync(fullPath)
    }

    if (!guessPackaged()) {
        const PythonShell = require('python-shell');

        let options = {
            mode: 'text',
            pythonPath: '/usr/bin/python3',
            pythonOptions: ['-u', '-m'], // get print results in real-time
        };

        let pyProc = new PythonShell('pyapp', options, function (err, results) {
            if (err) console.log(err);
        });

        pyProc.on('message', function (message) {
            // received a message sent from the Python script (a simple "print" statement)
            console.log(message);
        });

        /*
        pyProc.stdout.on('data', (data) => {
            console.log(uint8arrayToString(data));
        });

        pyProc.stderr.on('data', (data) => {
            // As said before, convert the Uint8Array to a readable string.
            console.log(uint8arrayToString(data));
        });
        */

        return pyProc.childProcess;
    } else {
        const getScriptPath = () => {
            let fullpath = path.join(__dirname, 'pyappdist', 'server');

            if (process.platform === 'win32') {
                fullpath += '.exe'
            }

            return fullpath;
        }

        let pyProc = require('child_process').execFile(getScriptPath());
        return pyProc;
    }
}

function createWindow() {
    var http = require("http");
    http.createServer(function (req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/plain'
        });
        res.write('Hello World!');
        res.end();

        req.on('data', chunk => {
            var data = JSON.parse(chunk);

            if (data.message == 'login_succeed') {
                //resizeWithAnimation(window, 1280, 960);
                window.setSize(1280, 960, true);
            }

            console.log(`Data: ${data.message}`)
        });
        req.on('end', () => {
            res.end('ok');
        });
    }).listen(8000);


    var menu = Menu.buildFromTemplate([{
        label: 'Menu',
        submenu: [{
                label: 'Ask to descens infantil',
                click() {
                    net.addListener
                    const request = net.request({
                        method: 'POST',
                        protocol: 'http:',
                        hostname: '127.0.0.1',
                        port: 10001,
                        path: '/ask'
                    })

                    request.on('response', (response) => {
                        console.log(`STATUS: ${response.statusCode}`)
                        //console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
                        response.on('data', (chunk) => {
                            var data = JSON.parse(chunk);
                            console.log(`Data: ${data.message}`)
                        })
                        response.on('end', () => {
                            console.log('No more data in response.')
                        })
                    })

                    request.end()
                }
            },
            {
                label: 'Web descens infantil',
                click() {
                    shell.openExternal('http://descensinfantil.cat')
                }
            },
            {
                label: 'Exit',
                click() {
                    proc.kill('SIGINT');
                    app.quit()
                }
            }
        ]
    }])

    var app_menu = Menu.getApplicationMenu();

    if (app_menu) {
        for (i = 0; i < menu.items.length; ++i) {
            app_menu.append(menu.items[i]);
        }

        Menu.setApplicationMenu(app_menu);
    } else {
        Menu.setApplicationMenu(menu)
    }

    function checkIfFlaskIsOnline(window, url) {
        var http = require('http');
        http.get(url, (res) => {
            console.log('Flask is Ready!');
            window.loadURL('http://127.0.0.1:10001/');
        }).on('error', (e) => {
            console.log('Flask is Offline');
            setTimeout(() => {
                checkIfFlaskIsOnline(window, url);
            }, 500);
        });
    }

    window = new BrowserWindow({
        width: 600,
        height: 400,
        webPreferences: {
            nodeIntegration: false,
        }
    });

    window.loadFile('index.html');
    checkIfFlaskIsOnline(window, 'http://127.0.0.1:10001/');
}



app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        proc.kill('SIGINT');
        app.quit();
    }
})