// const Connection = require('../models/Connections');
// const Message = require('../models/Messages');



class WebSocketProject {

    // async messages(aWss, msg) {
    //     aWss.clients.forEach(client => {
    //         client.send(JSON.stringify({
    //             method: 'messages', message2: 'to message2'
    //         }));
    //     })
    // }


    async webSocketFunction(msg, aWss, ws) {
        switch (msg.method) {
            case "connection":
                this.connectionHandler(ws, msg, aWss);
                //await this.messages(aWss, msg)
                break
            case "messages":
                await this.broadcastConnection(ws, msg, aWss)
                break
            case "close":
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
                //client.send(JSON.stringify({method: 'connection', username: 'msg.username'}))
                client.send(JSON.stringify(msg))
            }
        })
    }
}

module.exports = new WebSocketProject()
