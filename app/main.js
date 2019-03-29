const {
    app,
    BrowserWindow,
    Menu,
    net
} = require('electron')
const shell = require('electron').shell;
const path = require('path');

var this_is_a_test = "This is a test";

function startFlask() {  
    const guessPackaged = () => {
        const fullPath = path.join(__dirname, 'pyappdist')
        return require('fs').existsSync(fullPath)
    }

    if (!guessPackaged()) {
        let pyProc = require('python-shell');
        pyProc.run('pyapp/server.py', function (err, results) {
            if (err) console.log(err);
        });

        return pyProc;
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
            console.log(`Data: ${data.message}`)
        });
        req.on('end', () => {
            res.end('ok');
        });
    }).listen(8000);


    var menu = Menu.buildFromTemplate([{
        label: 'Menu',
        submenu: [{
                label: 'Ask to MovieDB',
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
                label: 'CoinMarketCap',
                click() {
                    shell.openExternal('http://coinmarketcap.com')
                }
            },
            {
                label: 'Exit',
                click() {
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


    let proc = startFlask();


    window = new BrowserWindow({
        width: 800,
        height: 600
    })
    setTimeout(function () {
        window.loadURL('http://127.0.0.1:10001/')
    }, 500);
    //window.loadFile('index.html')

}



app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})