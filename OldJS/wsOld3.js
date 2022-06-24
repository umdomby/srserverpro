// Dependencies
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');


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

const privateKey = fs.readFileSync(path.resolve(__dirname,'./cert/umdomby/umdombykey.pem'));
const certificate = fs.readFileSync(path.resolve(__dirname,'./cert/umdomby/umdombycert.pem'));
const ca = fs.readFileSync(path.resolve(__dirname,'./cert/umdomby/umdombychain.pem'));

// const privateKey = fs.readFileSync(path.resolve(__dirname,'./cert/cyberbetonline/cyberbetonlinekey.pem'));
// const certificate = fs.readFileSync(path.resolve(__dirname,'./cert/cyberbetonline/cyberbetonlinecert.pem'));
// const ca = fs.readFileSync(path.resolve(__dirname,'./cert/cyberbetonline/cyberbetonlinechain.pem'));

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

const io = require('socket.io')(httpsServer);

const WebSocketSender = require("ws");


const start = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL)
            .then(() => console.log("Successfully connect to MongoDB."))
            .catch(err => console.error("Connection error", err));

        const wsESP = new WebSocketSender('ws://93.125.10.70:81');


        io.on('connection', function(socket) {
            console.log('new connection');
            socket.emit('message', 'This is a message from the dark side.');
        });


        // io.on('connection', client => {
        //     client.on('event', data => {
        //         wsESP.send(data)
        //         console.log(data)
        //     });
        //
        // });



        // wss.on('connection', (wsConnect) => {
        //     wss.onopen = function () {
        //         console.log('wss подключился');
        //     };
        //
        //     wsConnect.on('connection', (message) => {
        //         console.log("111111 connection: " + message);
        //         wsESP.on('open', function open() {
        //             wsESP.send(message);
        //             console.log("11111----111111 connection: " + message);
        //             // wsESP.send(JSON.stringify({
        //             //     id: message.id,
        //             //     username: message.username,
        //             //     method: message.method,
        //             // }));
        //         });
        //     });
        //
        //     // wsESP.onmessage = function(event) {
        //     //     console.log("Arduino onmessage work: " + event.data);
        //     //     wsConnect.send("Arduino reply2: " + event.data, (err) => {
        //     //         if (err) {
        //     //             console.log("Server error2: " + err);
        //     //         }
        //     //     });
        //     // };
        //
        //     console.log('The server is started, listening~');
        //
        //     wsConnect.on('message', (message) => {
        //         wsESP.send(message);
        //
        //         //const dgram = require('dgram');
        //         // const PORT_UDP = 1234;
        //         // const HOST = '93.125.10.70';
        //         // const messageUDP = new Buffer('My KungFu is Good!');
        //         // const client = dgram.createSocket('udp4');
        //         // client.send(messageUDP, 0, messageUDP.length, PORT_UDP, HOST, function(err, bytes) {
        //         //     if (err) throw err;
        //         //     console.log('UDP message sent to ' + HOST +':'+ PORT_UDP);
        //         //     client.close();
        //         // });
        //
        //         console.log("2222222 message: " + message);
        //         // wsESP.onmessage = function(event) {
        //         //     console.log("Arduino reply2: " + event.data);
        //         //     wsConnect.send("Arduino reply2: " + event.data, (err) => {
        //         //         if (err) {
        //         //             console.log("Server error2: " + err);
        //         //         }
        //         //     });
        //         // };
        //
        //     });
        // });

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
