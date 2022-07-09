// const crypto = require("crypto");
//
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
// const encrypter = new Encrypter("syndicate_robotics_123");

// const clearText = "123";
// const encrypted = encrypter.encrypt(clearText);
// console.log('1 ' + encrypted)
// const dencrypted = encrypter.dencrypt(encrypted);
// console.log('2 ' + clearText);
// console.log('3 ' + dencrypted);

const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const WebSocketServer = require('ws').Server;
//const WebSocket = require('ws');

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
//app.use(express.static(path.join(__dirname, 'public')));
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
//const httpsServerIO = https.createServer(credentials, app);
//const WebSocket = require('ws');
//global.arduino = {};

var clientsWSS = {};
var clientsWSA = {};




const start = async () => {

    try {
        await mongoose.connect(process.env.DATABASE_URL)
            .then(() => console.log("Successfully connect to MongoDB."))
            .catch(err => console.error("Connection error", err));

        // var wsa = new WebSocket('ws://192.168.0.107:81');
        // wsa.on('error', err => { console.error(err) })



        const wsa = new WebSocketServer({server: httpServer});
        wsa.on('connection', ws => {
            ws.isAlive = true;
            ws.on('pong', heartbeat);
            //global.wsg = ws
            ws.send('connected WS server')
            ws.on('message', msg => {
                msg = JSON.parse(msg)
                switch (msg.method) {
                    case "connection":
                        // const dencrypted = encrypter.dencrypt(msg.id);
                        // wsg.id = dencrypted
                        console.log('Connected Arduino id ' + msg.id)
                        ws.id = msg.id
                        break;
                    case "messages":
                        console.log('Arduino '+ msg.id + '|' + msg.messageL + '|' + msg.messageR)

                        break;
                    default:
                        //console.log('default')
                }
            })

        })

        function heartbeat() {
            this.isAlive = true;
        }

        const interval = setInterval(function ping() {
            wsa.clients.forEach(function each(ws) {
                if (ws.isAlive === false) return ws.terminate();
                ws.isAlive = false;
                ws.ping();
                console.log('Arduino client.id ' + ws.id + ' OPEN ')
            });
        }, 5000);

        wsa.on('close', function close() {
            clearInterval(interval);
        });

        const wss = new WebSocketServer({server: httpsServer});
        wss.on('connection', ws => {
            ws.on('message', msg => {
                msg = JSON.parse(msg)
                switch (msg.method) {
                    case "connection":
                        console.log('Connected Chrome id ' + msg.id)
                        ws.id = msg.id
                        wss.clients.forEach(function each(client) {
                            console.log('client.id connection Chrome ' + client.id)
                        });
                        wsa.clients.forEach(function each(client) {
                            console.log('client.id connection arduino ' + client.id)
                        });
                        const mess = JSON.stringify({
                            method: 'connection',
                            id: msg.id,
                        })
                        wssSend(mess, ws)
                        break;

                    case "messagesL":
                        let mess2 = JSON.stringify({
                            method: 'messagesL',
                            messageL: msg.messageL,
                            messageR: msg.messageR,
                            accel: msg.accel,
                            stop: msg.stop,
                        })
                        console.log('Chrome messagesL'+ msg.id + ' | R: ' + msg.messageR + ' | L: '+ msg.messageL + ' | ' + " method " + msg.method)
                        wssSend(mess2, ws)
                        wsaSend(mess2, ws)
                        break;
                    case "messagesR":
                        let mess3 = JSON.stringify({
                            method: 'messagesR',
                            messageR: msg.messageR,
                            messageL: msg.messageL,
                            accel: msg.accel,
                            stop: msg.stop,
                        })
                        console.log('Chrome messagesR'+ msg.id + ' | R: ' + msg.messageR + ' | L: '+ msg.messageL + ' | ' + " method " + msg.method)
                        wssSend(mess3, ws)
                        wsaSend(mess3, ws)
                        break;
                    case "messagesOnOff":
                        let mess4 = JSON.stringify({
                            method: 'messagesOnOff',
                            messageOnOff: msg.messageOnOff,
                        })
                        console.log('Chrome messageOnOff '+ msg.messageOnOff + ' id ' + msg.id)
                        wssSend(mess4, ws)
                        wsaSend(mess4, ws)
                        break;
                    case "messagesStop":
                        let mess5 = JSON.stringify({
                            method: 'messagesStop',
                            messageStop: msg.messageStop,
                        })
                        console.log('Chrome messageStop '+ 'id ' + msg.id)
                        wssSend(mess5, ws)
                        wsaSend(mess5, ws)
                        break;

                    case "messagesFBL":
                        let mess6 = JSON.stringify({
                            method: 'messagesFBL',
                            messageFBL: msg.messageFBL,
                        })
                        console.log('Chrome messageFBL '+ 'id ' + msg.id)
                        wssSend(mess6, ws)
                        wsaSend(mess6, ws)
                        break;

                    case "messagesFBR":
                        let mess7 = JSON.stringify({
                            method: 'messagesFBR',
                            messageFBR: msg.messageFBR,
                        })
                        console.log('Chrome messageFBR '+ 'id ' + msg.id)
                        wssSend(mess7, ws)
                        wsaSend(mess7, ws)
                        break;

                    default:
                        //console.log('default')
                }
            })
        })

        const wsaSend = (mess, ws)=> {
            wsa.clients.forEach(function each(client) {
                if (client.id === ws.id && client.readyState === client.OPEN) {
                    client.send(mess)
                }
            });
        }
        const wssSend = (mess, ws)=> {
            wss.clients.forEach(function each(client) {
                if (client.id === ws.id && client.readyState === client.OPEN) {
                    client.send(mess)
                }
            });
        }

        // const io = require('socket.io')(httpsServerIO);
        // let socketList = {};
        // // Socket
        // io.on('connection', (socket) => {
        //     console.log(`New User connected: ${socket.id}`);
        //     socket.on('disconnect', () => {
        //         socket.disconnect();
        //         console.log('User disconnected!');
        //     });
        //     socket.on('BE-check-user', ({ roomId, userName }) => {
        //         let error = false;
        //         io.sockets.in(roomId).clients((err, clients) => {
        //             clients.forEach((client) => {
        //                 if (socketList[client] == userName) {
        //                     error = true;
        //                 }
        //             });
        //             socket.emit('FE-error-user-exist', { error });
        //         });
        //     });
        //
        //     /**
        //      * Join Room
        //      */
        //     socket.on('BE-join-room', ({ roomId, userName }) => {
        //         // Socket Join RoomName
        //         socket.join(roomId);
        //         socketList[socket.id] = { userName, video: true, audio: true };
        //         // Set User List
        //         io.sockets.in(roomId).clients((err, clients) => {
        //             try {
        //                 const users = [];
        //                 clients.forEach((client) => {
        //                     // Add User List
        //                     users.push({ userId: client, info: socketList[client] });
        //                 });
        //                 socket.broadcast.to(roomId).emit('FE-user-join', users);
        //                 // io.sockets.in(roomId).emit('FE-user-join', users);
        //             } catch (e) {
        //                 io.sockets.in(roomId).emit('FE-error-user-exist', { err: true });
        //             }
        //         });
        //     });
        //     socket.on('BE-call-user', ({ userToCall, from, signal }) => {
        //         io.to(userToCall).emit('FE-receive-call', {
        //             signal,
        //             from,
        //             info: socketList[socket.id],
        //         });
        //     });
        //     socket.on('BE-accept-call', ({ signal, to }) => {
        //         io.to(to).emit('FE-call-accepted', {
        //             signal,
        //             answerId: socket.id,
        //         });
        //     });
        //     socket.on('BE-send-message', ({ roomId, msg, sender }) => {
        //         io.sockets.in(roomId).emit('FE-receive-message', { msg, sender });
        //     });
        //     socket.on('BE-leave-room', ({ roomId, leaver }) => {
        //         delete socketList[socket.id];
        //         socket.broadcast
        //             .to(roomId)
        //             .emit('FE-user-leave', { userId: socket.id, userName: [socket.id] });
        //         io.sockets.sockets[socket.id].leave(roomId);
        //     });
        //     socket.on('BE-toggle-camera-audio', ({ roomId, switchTarget }) => {
        //         if (switchTarget === 'video') {
        //             socketList[socket.id].video = !socketList[socket.id].video;
        //         } else {
        //             socketList[socket.id].audio = !socketList[socket.id].audio;
        //         }
        //         socket.broadcast
        //             .to(roomId)
        //             .emit('FE-toggle-camera', { userId: socket.id, switchTarget });
        //     });
        // });


        httpServer.listen(8081, () => {
            console.log('HTTP Server running on port 8081');
        });
        httpsServer.listen(4433, () => {
            console.log('HTTPS Server running on port 4433');
        });
        // httpsServerIO.listen(4434, () => {
        //     console.log('HTTPS Server SocketIO running on port 4434');
        // });


    } catch (e) {
        console.log(e)
    }
}

start()
