// Dependencies
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const WebSocketServer = require('ws').Server;

require('dotenv').config()
const mongoose = require('mongoose')
const cors = require('cors')
const fileUpload = require('express-fileupload')
const router = require('../routes')
const errorHandler = require('../middleware/ErrorHandlingMiddleware')

const path = require('path')
const app = express();
app.use(cors())
app.use(errorHandler)
app.use(express.json({ extended: true }))
app.use(express.static(path.resolve(__dirname, 'static')))
app.use(fileUpload({}))
app.use('/api', router)

// Certificate
// const privateKey = fs.readFileSync('/etc/letsencrypt/live/cyberbet.online/umdombykey.pem', 'utf8');
// const certificate = fs.readFileSync('/etc/letsencrypt/live/cyberbet.online/umdombycert.pem', 'utf8');
// const ca = fs.readFileSync('/etc/letsencrypt/live/cyberbet.online/umdombychain.pem', 'utf8');

// const privateKey = fs.readFileSync(path.resolve(__dirname,'./cert/umdomby/umdombykey.pem'));
// const certificate = fs.readFileSync(path.resolve(__dirname,'./cert/umdomby/umdombycert.pem'));
// const ca = fs.readFileSync(path.resolve(__dirname,'./cert/umdomby/umdombychain.pem'));

const privateKey = fs.readFileSync(path.resolve(__dirname,'./cert/cyberbetonline/cyberbetonlinekey.pem'));
const certificate = fs.readFileSync(path.resolve(__dirname,'./cert/cyberbetonline/cyberbetonlinecert.pem'));
const ca = fs.readFileSync(path.resolve(__dirname,'./cert/cyberbetonline/cyberbetonlinechain.pem'));

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

app.use((req, res) => {
    res.send('Hello there !');
});

// Starting both http & https servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

const WebSocket = require('ws');
var ws = new WebSocket('ws://192.168.0.107:81');
ws.on('error', err => { console.error(err) })

const start = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL)
            .then(() => console.log("Successfully connect to MongoDB."))
            .catch(err => console.error("Connection error", err));

        // ws.on('message', function message(data) {
        //     init_data = data
        //     console.log('received: %s', data);
        // });
        //setInterval(() => socketTest(ws.readyState), 5000)

        const wss = new WebSocketServer({server: httpsServer});
        wss.on('connection', onConnect);

        function onConnect(wsClient) {

            console.log('Новый пользователь wss');

            if(ws.readyState === 1) {
                ws.on('open', function open() {
                    ws.send(JSON.stringify({
                        username: 'user',
                        method: "connection",
                    }));
                });

                ws.on('message', function message(data) {
                    wsClient.send(data);
                    console.log('received: %s', data);
                });
            }

            wsClient.on('message', function(message) {
                if(ws.readyState === 1){
                    ws.send(message);
                }
                console.log('подключился к ардуино wss: ' + message);
            })
        }

        httpServer.listen(8080, () => {
            console.log('HTTP Server running on port 8080');
        });

        httpsServer.listen(4433, () => {
            console.log('HTTPS Server running on port 4433');
        });

    } catch (e) {
        console.log(e)
    }
}

start()


const socketTest = (readyState) => {
    console.log('socketTest')
    // if(readyState !== 1) {
    //     console.log('11111111111111')
    //     ws = new WebSocket('ws://192.168.0.107:81');
    //     if(readyState === 1) {
    //         ws.on('open', function open() {
    //                 ws.send(JSON.stringify({
    //                     username: 'user',
    //                     method: "connection",
    //                 }));
    //             })
    //         }
    // };
}
