const PORT = 7000;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
require('express-ws')(app); //library used for websocket connection
const { connect } = require('./db/connection');
const generateUniqueId = require('./helperFunctions/generateUniqueId');
const userRoutes = require('./Routes/users')
const docRoutes = require('./Routes/docs')

//handling CORS (CROSS-ORIGIN-REQUEST)
app.use(cors({
    origin: '*',
    credentials: true
}))



app.use(express.json());  //for parsing json data


let connections = {}  // in memory data strucutre for maintaining currently connected clients


let rooms = {}              //a room is identified by its roomId. 
//Each room has clients which stores how many clients are in that room.
//document_id-> which document it references
//owner-> owner of the document who has the right to share the roomId with anyone logged into the system.

const resolveConflict = (current, prev, clientId) => {
    //single character changes
    if (current.start === current.end && prev.start === prev.end) {
        //users applying changes at the same position
        if (current.start >= prev.start) {
            if (prev.event === 'insert') {
                current.start++;
                current.end++;
            }
        }
    }

    else if (current.start === current.end && prev.start !== prev.end) {
        if ((prev.event == 'delete-forward' || prev.event === 'delete-backward')) {
            //nullify this change
            if (current.start >= prev.start && current.start < prev.end) {
                //modify the previous event at the client
                current.event = 'none';
                if (current.event === 'insert') {
                    connections[clientId].send(JSON.stringify({ event: "delete-backward", start: prev.start, end: prev.start + 1 }))
                }
                //currently leaving the delete handler
            }

            else if (['insert', 'delete-forward', 'delete-backward'].indexOf(current.event) > -1 && current.start >= prev.end) {
                current.start -= (prev.end - prev.start);
            }

        }


    }

}

connect((db) => {
    // db object attached to req, so it can be accessed from any routes
    app.use((req, res, next) => {
        req.db = db;
        next();
    })


    app.use(userRoutes)
    app.use(docRoutes)

    //socket connection
    app.ws('/', (con, request) => {
        const secWebSocketProtocolHeader = request.rawHeaders.findIndex(val => /sec-websocket-protocol/i.test(val));
        const documentId = request.rawHeaders[secWebSocketProtocolHeader + 1].split(',')[1].trim();
        console.log(documentId);
        let clientId = generateUniqueId(5); //a unique id is given to each client to identify them later.

        let roomId = '';
        //find if any room exits with that documentId
        for (let room in rooms) {
            if (rooms[room]['document'] === documentId) {
                roomId = room;
                break;
            }
        }

        console.log(roomId);

        if (!roomId) {
            roomId = generateUniqueId(4);
        }

        connections[clientId] = con;


        if (!rooms.hasOwnProperty(roomId)) {
            rooms[roomId] = {};
            rooms[roomId]['clients'] = [];
            rooms[roomId]['prevOperation'] = {};
            rooms[roomId]['document'] = documentId
        }



        rooms[roomId]['clients'].push(clientId);


        con.on('message', (msg) => {
            const receivers = rooms[roomId]['clients'].filter(e => {
                return e !== clientId;
            })
            const parsedMsg = JSON.parse(msg);
            if (rooms[roomId]['prevOperation'] && Object.keys(rooms[roomId]['prevOperation']).length > 0 && rooms[roomId]['prevOperation']['client'] !== clientId) {
                //stuck at this point
                // resolveConflict(parsedMsg, rooms[roomId]['prevOperation'], clientId);
            }

            rooms[roomId]['prevOperation'] = parsedMsg;
            rooms[roomId]['prevOperation']['client'] = clientId;

            if (receivers.length > 0) {
                for (let i = 0; i < receivers.length; i++) {
                    connections[receivers[i]].send(msg);
                }
            }

        })
    })

    app.listen(PORT, () => {
        console.log(`app is listening on port ${PORT}`)
    })

});
