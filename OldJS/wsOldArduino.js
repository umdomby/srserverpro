// const crypto = require("crypto");
// class Encrypter {
//     constructor(encryptionKey) {
//         this.algorithm = "aes-192-cbc";
//         this.key = crypto.scryptSync(encryptionKey, "salt", 24);
//     }
//     encrypt(clearText) {
//         const iv = crypto.randomBytes(16);
//         const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
//         const encrypted = cipher.update(clearText, "utf8", "hex");
//         return [
//             encrypted + cipher.final("hex"),
//             Buffer.from(iv).toString("hex"),
//         ].join("|");
//     }
//     dencrypt(encryptedText) {
//         const [encrypted, iv] = encryptedText.split("|");
//         if (!iv) throw new Error("IV not found");
//         const decipher = crypto.createDecipheriv(
//             this.algorithm,
//             this.key,
//             Buffer.from(iv, "hex")
//         );
//         return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
//     }
// }
// const encrypter = new Encrypter("secret");
// const clearText = "adventure time 12312";
// const encrypted = encrypter.encrypt(clearText);
// console.log(encrypted)
// const dencrypted = encrypter.dencrypt('d2f75528d22a985ff7a6739c6d19684c6950cec0d7006f518174a4673946ca4b|189dbfece769e56d0cfeac6aae371e24');
// console.log(clearText);
// console.log(dencrypted);


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

//const WebSocket = require('ws');

//global.arduino = {};

const start = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL)
            .then(() => console.log("Successfully connect to MongoDB."))
            .catch(err => console.error("Connection error", err));

        // var wsa = new WebSocket('ws://192.168.0.107:81');
        // wsa.on('error', err => { console.error(err) })

        const wsa = new WebSocketServer({server: httpServer});
        wsa.on('connection', ws => {
            global.wsg = ws
            ws.send('connected WS server')
            ws.on('message', msg => {
                msg = JSON.parse(msg)
                switch (msg.method) {
                    case "connection":
                        wsg.id = msg.id
                        console.log('Connected Arduino id ' + msg.id)
                        break;
                    case "messages":
                        console.log('Arduino '+ msg.id + '|' + msg.message + '|' + msg.message2)
                        // wsa.clients.forEach(function each(client) {
                        //     console.log('client.id arduino ' + client.id)
                        //
                        //     // if (client.id === wsg.id && client.readyState === client.OPEN) {
                        //     //     wsg.send(mess2)
                        //     // }
                        // });
                        break;
                }
            })

        })

        // wsa.on('connection', onConnect);
        // function onConnect(wsClient) {
        //     console.log('?????????? ???????????????????????? arduino');
        //     wsClient.send('???????????? ???? ??????????????');
        //     global.wsg = wsClient
        //     // wsClient.onmessage = function (message) {
        //     //     console.log('Message: %s', message.data);
        //     // };
        //     wsClient.on('message', function(message) {
        //         console.log('Message: %s', message);
        //     })
        // }

        const wss = new WebSocketServer({server: httpsServer});
        wss.on('connection', ws => {
            ws.on('message', msg => {
                msg = JSON.parse(msg)
                switch (msg.method) {
                    case "connection":
                        const mess = JSON.stringify({
                            method: 'connection',
                            username: msg.username,
                            txt:'txt',
                            degreegoback:'1',
                            degreeleftright:'1',
                            delaycommand:'0',
                            accel:'1',
                            languages:'ru-RU'
                        })
                        //ws.send(mess)
                        //console.log('connection ' + msg.id + '|' + msg.username)
                        console.log('Connected Chrome id ' + msg.id)
                        ws.id = msg.id
                        // wss.clients.forEach(function each(client) {
                        //     if (client.id === ws.id && client.readyState === client.OPEN) {
                        //         client.send(mess);
                        //     }
                        // });

                        wss.clients.forEach(function each(client) {
                            console.log('client.id forEach Chrome ' + client.id)
                        });

                        wsa.clients.forEach(function each(client) {
                            console.log('client.id forEach arduino ' + client.id)
                        });

                        break

                    case "messages":
                        let mess2 = JSON.stringify({
                            method: 'messages',
                            message: msg.message,
                            message2: msg.message2,
                            accel: msg.accel,
                            stop: msg.stop,
                        })
                        console.log('Chrome '+ msg.id + '|' + msg.message + '|' + msg.message2)

                        // wss.clients.forEach(function each(client) {
                        //     // console.log('client.id forEach Chrome ' + client.id)
                        //     // if (client.id === ws.id && client.readyState === client.OPEN) {
                        //     //     client.send(mess2);
                        //     // }
                        // });

                        wsa.clients.forEach(function each(client) {
                            //console.log('client.id forEach arduino ' + client.id)
                            if (client.id === ws.id && client.readyState === client.OPEN) {
                                wsg.send(mess2)
                            }
                        });
                        // wsg.send(mess2)
                        break
                }
            })
        })

        // wsa.on('connection', ws => {
        //     ws.on('message', msg => {
        //         msg = JSON.parse(msg)
        //         switch (msg.method) {
        //             case "connection":
        //                 console.log('connection ' + msg.id + '|' + msg.username)
        //                 break
        //             case "messages":
        //                 ws.send(arduino)
        //                 break
        //         }
        //     })
        // })

        httpServer.listen(81, () => {
            console.log('HTTP Server running on port 81');
        });
        httpsServer.listen(4433, () => {
            console.log('HTTPS Server running on port 4433');
        });

    } catch (e) {
        console.log(e)
    }
}

start()
