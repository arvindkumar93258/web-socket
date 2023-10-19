// const http = require('http');
// const { connect } = require('http2');
// const WebSocketServer = require('websocket').server;
// let connection;

// const httpServer = http.createServer((req, res) => {
//     console.log("We have received a request!!");
// })



// const websocket = new WebSocketServer({
//     "httpServer": httpServer,
// })

// websocket.on('request', request => {
//     connection = request.accept(null, request.origin)
//     connection.on("open", () => {
//         console.log("Opened!!!");
//         connection.send("Welcome to the server!"); // Sending a welcome message when the connection is open
//     })
//     connection.on("close", () => {
//         console.log("Closed!!!");
//         connection.send("thanks for visiting the server!"); // Sending a welcome message when the connection is open

//     })
//     connection.on("message", message => {
//         console.log(`We got an message!!! and message: ${message.utf8Data}`);
//         connection.send(`Hey Server, Me(client) received your message: ${message.utf8Data}`);
//     })
//     // sendDataToClient("Hey it is server");
//     // setInterval(sendDataToClient, 5000);
//     sendevery5sec();
// })

// httpServer.listen(8080, () => {
//     console.log("Server is runnin on 8080");
// })

// // Function to send data to the client
// function sendDataToClient(message) {
//     if (connection) {
//         connection.send(message);
//     } else {
//         console.log("No active connection to send data to.");
//     }
// }

// function sendevery5sec() {
//     connection.send(`Message ${Math.random() * 11}`);
//     setTimeout(sendevery5sec, 5000);
// }

// /*
// 1. to connect with the server 
// let ws = new WebSocket('ws://localhost:8080/');
// 2. to bind the message from the server
// wa.onmessage = (message) => {
//     console.log(message.utf8Data);
//     ...other things
// }
// 3. send data from client
// ws.send(message);
// 4. close the connection
// ws.close();


// web-socket pros
// 1. full duplex connection
// 2. http compatible
// 3. firewall friendly

// web-socke cons
// 1. proxying is tricky
// 2. L7 L/B chellanging(timeouts)
// 3. statefull, difficult to horizontally scale

// Do you havet ti use websockts?
// 1. No! Rule of thumb - do you absolutely need bidirectionsl communication
// 2. Long polling
// 3. EventSource


// */


const http = require("http");
const app = require("express")();
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"))

app.listen(9091, () => console.log("Listening on http port 9091"))
const websocketServer = require("websocket").server
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening.. on 9090"))
//hashmap clients
const clients = {};
const games = {};

const wsServer = new websocketServer({
    "httpServer": httpServer
})
wsServer.on("request", request => {
    //connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!"))
    connection.on("close", () => console.log("closed!"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)
        //I have received a message from the client
        //a user want to create a new game
        if (result.method === "create") {
            const clientId = result.clientId;
            const gameId = guid();
            games[gameId] = {
                "id": gameId,
                "balls": 20,
                "clients": []
            }

            const payLoad = {
                "method": "create",
                "game": games[gameId]
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        //a client want to join
        if (result.method === "join") {

            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];
            if (game.clients.length >= 3) {
                //sorry max players reach
                return;
            }
            const color = { "0": "Red", "1": "Green", "2": "Blue" }[game.clients.length]
            game.clients.push({
                "clientId": clientId,
                "color": color
            })
            //start the game
            if (game.clients.length === 3) updateGameState();

            const payLoad = {
                "method": "join",
                "game": game
            }
            //loop through all clients and tell them that people has joined
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        }
        //a user plays
        if (result.method === "play") {
            const gameId = result.gameId;
            const ballId = result.ballId;
            const color = result.color;
            let state = games[gameId].state;
            if (!state)
                state = {}

            state[ballId] = color;
            games[gameId].state = state;

        }

    })

    //generate a new clientId
    const clientId = guid();
    clients[clientId] = {
        "connection": connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }
    //send back the client connect
    connection.send(JSON.stringify(payLoad))

})


function updateGameState() {

    //{"gameid", fasdfsf}
    for (const g of Object.keys(games)) {
        const game = games[g]
        const payLoad = {
            "method": "update",
            "game": game
        }

        game.clients.forEach(c => {
            clients[c.clientId].connection.send(JSON.stringify(payLoad))
        })
    }

    setTimeout(updateGameState, 500);
}



function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
