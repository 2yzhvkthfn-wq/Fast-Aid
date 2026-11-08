// Socket IO server-side 

const dbFunctions = require('./database/db-functions');
const mongoose = require('mongoose');

function setUp(server) {

    // Instanciating Socket.IO server with existing HTTP Express server
    const io = require('socket.io')(server);

    io.on('connection', (socket) => { // Listener for new connections from client-side. Socket represents a user session 

        socket.on('join', (data) => {
            socket.join(data.username); // Socket joins a room named after username to allow private communication between server and client with the given username.
            console.log(`User joined room: ${data.username}`);
        });
        

        // Listen to "emergency-request" event from patients (client-side)
        socket.on('emergency-request', async(emergencyInfo) =>{
            
            // Retrieve emergency details
            const location = {
                coordinates: [emergencyInfo.location.longitude, emergencyInfo.location.latitude],
                address: emergencyInfo.location.address
            }
            const emergencyTime = new Date();
            const emergencyId = new mongoose.Types.ObjectId(); // Generate a unique emergency Id

            // Data to be passed to event
            emergencyInfo.emergencyId = emergencyId;
            emergencyInfo.emergencyTime = emergencyTime;
            
            // Save Emergency details in DB
            await dbFunctions.saveEmergency(emergencyId, emergencyTime, location, emergencyInfo.patientId, "pending");

            // Get paramedics within 2 km of emergency location
            const paramedics = await dbFunctions.getNearestParamedics(location.coordinates, 2000); 

            // Fire a "request-emergency" signal to all near paramedics (client-side)
            for (let i=0; i<paramedics.length; i++){
                /* io.sockets accesses all connected instances 
                .in() targets only the rooms with the nearest paramedics */

                console.log(`Sending emergency request to Paramedic ${paramedics[i].username} located at ${paramedics[i].location.address}`);
                io.sockets.in(paramedics[i].username).emit("emergency-request", emergencyInfo);
            }
        })

        
        // Listen to "request-accepted" event from paramedics (client-side)
        socket.on("request-accepted", async(info) => {
            const emergencyId = info.emergencyId;

            // Fetch the emergency
            emergencyInfo = await dbFunctions.getEmergency(emergencyId)

            // Update details of the emergency instance
            await dbFunctions.updateEmergency(emergencyId, info.paramedicInfo.username, "accepted");

            // Fire a "request-accepted" signal in the patient room and send paramedic details to display
            console.log(`Paramedic ${info.paramedicInfo.username} accepted the request`)
            io.sockets.in(emergencyInfo.patientId).emit("request-accepted", info.paramedicInfo);
        })

    })

}


exports.setUp = setUp;