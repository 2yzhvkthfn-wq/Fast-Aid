const models = require('./models.js');
const Paramedic = models.Paramedic;
const Emergency = models.Emergency;

// Return paramedics within a specific distance
function getNearestParamedics(coordinates, maxRange) {
    return Paramedic.find({
        location: {
            $near: { // near command is a geospatial query opearator on GeoJSON objects of type Point
                $geometry: {
                    type: "Point",
                    coordinates: coordinates // longitude, latitude
                },
                $maxDistance: maxRange
            }
        }
    })
    .exec() // Method in Mongoose to execute a query (async operation) and return a promise
    .catch(error => {
        console.log(error);
    });
}


// Return paramedic info given username
function getParamedicInfo(username){

    // Mongoose method to get a single instance and return a promise
    return Paramedic.findOne({ username: username }, { 
        // fields to return
        username: 1,
        phone: 1,
        location: 1  
    })
    .exec()
    .catch(error => {
        console.log(error);
    });
}


function saveEmergency(requestId, requestTime, location, patientId, status){
    // Instantiate an Emergency
    const emergency = new Emergency({
        "_id": requestId,
        requestTime: requestTime,
        location: location,
        patientId: patientId,
        status: status
    });

    return emergency.save().catch(error => {console.log(error)})

}

// Update emergency after request is accepted
function updateEmergency(emergencyId, paramedicId, status){
    return Emergency.findOneAndUpdate({"_id": emergencyId }, {
        //details to udpate
        status: status,
        paramedicId: paramedicId
    }).catch(error => {console.log(error)})
}

// Fetch a specific emergency
function getEmergency(emergencyId) {
    return Emergency.findOne({"_id": emergencyId
    }).catch(error => {console.log(error)})
}


// Fetch all emergency requests
async function getEmergencies() {
    try {
        // Fetch all emergency documents
        const emergencies = await Emergency.find({}, {
            requestTime: 1,
            status: 1,
            location: 1,
            _id: 0
        }).exec();
        
        return emergencies; // Return the data as an array
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// Get Emergency history of a patient
function getPatientHistory(username) {
    return Emergency.find({ patientId: username }, { 
        'location.address': 1,
        requestTime: 1,
        status: 1 
    })
    .lean() // Converts Mongoose documents to JS objects for compatibility with Handlebars
    .exec()
    .catch(error => {
        console.log(error);
        return [];
    });
}

// Get Emergency history of a paramedic
function getParamedicHistory(username) {
    return Emergency.find({ paramedicId: username }, { 
        patientId: 1,
        'location.address': 1,
        requestTime: 1,
    })
    .lean() // Converts Mongoose documents to JS objects for compatibility with Handlebars
    .exec()
    .catch(error => {
        console.log(error);
        return [];
    });
}


exports.getNearestParamedics = getNearestParamedics;
exports.getParamedicInfo = getParamedicInfo;
exports.saveEmergency = saveEmergency;
exports.updateEmergency = updateEmergency;
exports.getEmergencies = getEmergencies;
exports.getEmergency = getEmergency;
exports.getPatientHistory = getPatientHistory;
exports.getParamedicHistory = getParamedicHistory;