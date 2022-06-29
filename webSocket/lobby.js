const Connection = require('../models/Connections');
const Message = require('../models/Messages');


class Lobby {

    intervalLobby(aWss){
        setInterval(()=> this.getWsClients(aWss), 5000);
    };

    diff(a, b) {
        return a.filter(function(i) {return b.indexOf(i) < 0;});
    };

    async getWsClients(aWss) {
        const clientsMessage = [];
        aWss.clients.forEach(client => {
            clientsMessage.push(client.username);
        })
        let clientsNoRepeatUsers = [...new Set(clientsMessage)];
        const online = await Connection.find().count()
        const users = await Connection.find()
        let userMessage = [];
        Object.keys(users).map(item => userMessage.push(users[item].user))

        if (clientsNoRepeatUsers.length < online){
            let users = this.diff(userMessage, clientsNoRepeatUsers)
            for(let i = 0; i < users.length; i++){
                await Connection.deleteMany({user: users[i]});
                await Message.deleteMany({user: users[i]});
            }
        }
        aWss.clients.forEach(client => {
            client.send(JSON.stringify({method: 'online', clientsNoRepeatUsers}));
        })
        await this.messages(aWss)
    }

    async messages(aWss) {
        await Message.find().then(messages => {
            aWss.clients.forEach(client => {
                client.send(JSON.stringify({method: 'messages', messages: messages}));
            })
        })
    }

    delWsClients(aWss, username){
        let clientsMessage = [];
        aWss.clients.forEach(client => {
            clientsMessage.push(client.username);
            clientsMessage = clientsMessage.filter(word => word !== username);
        })
        let clientsNoRepeatUsers = [...new Set(clientsMessage)];
        aWss.clients.forEach(client => {
            client.send(JSON.stringify({method:'online', clientsNoRepeatUsers}));
        })
    }

    async webSocketFunction(msg, aWss, ws) {
        switch (msg.method) {
            case "connection":
                try {
                    this.connectionHandler(ws, msg, aWss);
                    await Message.find().then(messages => {
                        aWss.clients.forEach(client => {
                            client.send(JSON.stringify({method:'messages', messages:messages}));
                        })
                    })
                    const login = await Connection.findOne({user: msg.username})
                    if(login === null){
                        const online = new Connection({ user: msg.username});
                        await online.save();
                    }
                    await this.getWsClients(aWss);
                }catch (e) {
                    console.log('connection: '+ e)
                }
                break
            case "messages":
                const message = new Message({ messages: msg.messages, user: msg.username});
                await message.save();
                await this.messages(aWss)
                break
            case "close":
                this.delWsClients(aWss, msg.username);
                await Connection.deleteMany({user: msg.username});
                await Message.deleteMany({user: msg.username});
                await this.messages(aWss)
                break
        }
    }

    connectionHandler = (ws, msg, aWss) => {
        ws.id = msg.id
        ws.username = msg.username
        this.broadcastConnection(ws, msg, aWss)
    }

    broadcastConnection = (ws, msg, aWss) => {
        aWss.clients.forEach(client => {
            if (client.id === msg.id) {
                client.send(JSON.stringify(msg))
            }
        })
    }
}

module.exports = new Lobby()
