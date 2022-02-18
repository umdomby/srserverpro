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

// const { v4: uuidv4 } = require('uuid');
// const privateKey = fs.readFileSync(path.resolve(__dirname,'./cert/servicerobotpro/privkey.pem'));
// const certificate = fs.readFileSync(path.resolve(__dirname,'./cert/servicerobotpro/cert.pem'));
// const ca = fs.readFileSync(path.resolve(__dirname,'./cert/servicerobotpro/chain.pem'));

const privateKey = fs.readFileSync(path.resolve(__dirname,'./cert/umdomby/privkey.pem'));
const certificate = fs.readFileSync(path.resolve(__dirname,'./cert/umdomby/cert.pem'));
const ca = fs.readFileSync(path.resolve(__dirname,'./cert/umdomby/chain.pem'));

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

// const WebSocket = require('ws');
// var ws = new WebSocket('ws://192.168.0.107:81');
// ws.on('error', err => { console.error(err) })

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
        wss.on('connection', ws => {
            //ws.id = uuidv4()
            ws.on('message', msg => {
                msg = JSON.parse(msg)
                switch (msg.method) {
                    case "connection":
                        const mess = JSON.stringify({
                            method: 'connection',
                            username: msg.username,
                            txt:'txt',
                            degreegoback:2,
                            degreeleftright:1,
                            delaycommand:1,
                            accel:1,
                            languages:'ru-RU'
                        })
                        connectionHandler2(ws, msg, mess);
                        console.log('connection')
                        break
                    case "messages":
                        let mess2 = JSON.stringify({
                            method: 'messages',
                            message: msg.message,
                            message2: msg.message2,
                            stop: 0
                        })
                        broadcastConnection2(msg, mess2)
                        console.log(msg.message + '|' + msg.message2)
                        break
                }
            })
        })

        connectionHandler2 = (ws, msg, mess) => {
            ws.id = msg.id
            ws.username = msg.username
            broadcastConnection2(msg, mess)
        }

        broadcastConnection2 = (msg, mess) => {
            wss.clients.forEach(client => {
                if (client.id === msg.id) {
                    client.send(mess)
                }
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
