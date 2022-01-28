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
const router = require('./routes/index')
const errorHandler = require('./middleware/ErrorHandlingMiddleware')

const path = require('path')
const app = express();
app.use(cors())
app.use(errorHandler)
app.use(express.json({ extended: true }))
app.use(express.static(path.resolve(__dirname, 'static')))
app.use(fileUpload({}))
app.use('/api', router)

// Certificate
// const privateKey = fs.readFileSync('/etc/letsencrypt/live/cyberbet.online/privkey.pem', 'utf8');
// const certificate = fs.readFileSync('/etc/letsencrypt/live/cyberbet.online/cert.pem', 'utf8');
// const ca = fs.readFileSync('/etc/letsencrypt/live/cyberbet.online/chain.pem', 'utf8');

const privateKey = fs.readFileSync(path.resolve(__dirname,'./cert/privkey.pem'));
const certificate = fs.readFileSync(path.resolve(__dirname,'./cert/cert.pem'));
const ca = fs.readFileSync(path.resolve(__dirname,'./cert/chain.pem'));

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






const WebSocketSender = require("ws");

const start = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL)
            .then(() => console.log("Successfully connect to MongoDB."))
            .catch(err => console.error("Connection error", err));

        const wss = new WebSocketServer({server: httpsServer});
        const wsESP = new WebSocketSender('ws://cyberbet.online:81');

        wss.on('connection', (wsConnect) => {
            wsConnect.on('connection', (message) => {
                wsESP.on('open', function open() {
                    wsESP.send(JSON.stringify({
                        id: message.id,
                        username: message.username,
                        method: message.method,
                    }));
                });
            });

            // wsESP.onmessage = function(event) {
            //     console.log("Arduino reply: " + event.data);
            //     wsConnect.send(`Arduino reply: ${event.data}`, (err) => {
            //         if (err) {
            //             console.log(`Server error: ${err}`);
            //         }
            //     });
            // };

            console.log('The server is started, listening~');

            wsConnect.on('message', (message) => {
                wsESP.send(message);

                //const dgram = require('dgram');
                // const PORT_UDP = 1234;
                // const HOST = '93.125.10.70';
                // const messageUDP = new Buffer('My KungFu is Good!');
                // const client = dgram.createSocket('udp4');
                // client.send(messageUDP, 0, messageUDP.length, PORT_UDP, HOST, function(err, bytes) {
                //     if (err) throw err;
                //     console.log('UDP message sent to ' + HOST +':'+ PORT_UDP);
                //     client.close();
                // });

                console.log(`Server received: ${message}`);
                wsESP.onmessage = function(event) {
                    console.log("Arduino reply: " + event.data);
                    wsConnect.send(`Arduino reply: ${event.data}`, (err) => {
                        if (err) {
                            console.log(`Server error: ${err}`);
                        }
                    });
                };

                // wsConnect.send(`Server reply: ${message}`, (err) => {
                //     if (err) {
                //         console.log(`Server error: ${err}`);
                //     }
                // });
            });
        });

        httpServer.listen(80, () => {
            console.log('HTTP Server running on port 80');
        });

        httpsServer.listen(443, () => {
            console.log('HTTPS Server running on port 443');
        });

    } catch (e) {
        console.log(e)
    }
}

start()
