// API endpoints

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const dbFunctions = require('./database/db-functions.js');
const models = require('./database/models.js');
const Paramedic = models.Paramedic;
const Patient = models.Patient;

// Env variables for secrets
const mapboxToken = process.env.MAPBOX_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;


// Login (JWT)
router.post('/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        let user;
        if (role === "patient"){
            user = await Patient.findOne({ username });
        }
        else if (role === "paramedic") {
            user = await Paramedic.findOne({ username });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid Username' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid Password' });
        }
        // Generate a JWT
        const token = jwt.sign(
            { userId: user._id, username: user.username, role: role }, 
            JWT_SECRET,                                                    
            { expiresIn: '1h' }                                            
        );

        res.status(200).json({ token });

    } catch (error) {
        res.status(500).json({ error: 'Login Failed' });
    }
});


// Fetch nearest paramedics given lat and lgn (within 2 km)
router.get('/paramedics', async (req, res) => {

    // Request object query parameters
    const longitude = Number(req.query.lng);
    const latitude = Number(req.query.lat);

    const nearestParamedics = await dbFunctions.getNearestParamedics([longitude, latitude], 2000); // Get paramedics within 2 km

    res.json({
        paramedics: nearestParamedics
    });
});


// Get paramedic details given username
router.get('/paramedics/info', async (req, res) => {
    const paramedicDetails = await dbFunctions.getParamedicInfo(req.query.username);

    res.json({
        paramedicDetails: paramedicDetails
    })
})


// Get all emergencies and convert them to GeoJSON (for heat map rendering)
router.get('/emergencies/info', async (req, res) => {
    const emergencies = await dbFunctions.getEmergencies();
    const geojson_emergencies = [];

    for (let i = 0; i < emergencies.length; i++) {
        const location = emergencies[i].location || {};
        const coordinates = location.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) {
            continue;
        }
        geojson_emergencies.push(
            {
                type: "Feature",
                geometry: {
                    type: "Point", coordinates: coordinates
                },
                properties: {
                    status: emergencies[i].status,
                    requestTime: emergencies[i].requestTime,
                    address: location.address
                }

            })
    }

    const geojson = { type: "FeatureCollection", features: geojson_emergencies };
    res.json(geojson);
})


// Page Rendering Endpoints

router.get('/', (req, res) => {
    res.render('index.html')
})

router.get('/patient.html', authenticateJWT, (req, res) => {
    try{
        const { username } = req.user; // Extracted by middleware
        res.render('patient.html', {
            username: username,
            token: req.query.token,
            mapboxToken: mapboxToken
        })
    } catch (error) {
        res.status(500).json({ message: "Error loading patient page"})
    }
})

router.get('/paramedic.html', authenticateJWT, (req, res) => {
    try{
        const { username } = req.user; // Extracted by middleware
        res.render('paramedic.html', {
            username: username,
            token: req.query.token,
            mapboxToken: mapboxToken
        })
    } catch (error) {
        res.status(500).json({ message: "Error loading paramedic page"})
    }
})

router.get('/patient-history.html', authenticateJWT, async (req, res) => {
    try{
        const { username } = req.user; // Extracted by middleware
        const patientHistory = await dbFunctions.getPatientHistory(username);
        res.render('patient-history.html', {
            username: username,
            token: req.query.token,
            patientHistory: patientHistory
        })
    } catch (error) {
        res.status(500).json({ message: "Error loading patient history page"})
    }
})

router.get('/paramedic-history.html', authenticateJWT, async (req, res) => {
    try{
        const { username } = req.user; // Extracted by middleware
        const paramedicHistory = await dbFunctions.getParamedicHistory(username);
        res.render('paramedic-history.html', {
            username: username,
            token: req.query.token,
            paramedicHistory: paramedicHistory
        })
    } catch (error) {
        res.status(500).json({ message: "Error loading paramedic history page"})
    }
})

// Heat map page
router.get('/emergencies.html', authenticateJWT, (req, res) => {
    try{
        const { role } = req.user; // Extracted by middleware
        res.render('requests.html', {
            role: role,
            token: req.query.token,
            mapboxToken: mapboxToken
        })
    } catch (error) {
        res.status(500).json({ message: "Error loading emergency heat map page"})
    }
})


// Helper function: Middleware to authenticate JWT
function authenticateJWT(req, res, next) {
    const token = req.query.token; // Extract token

    if (!token) {
        return res.status(401).json({ message: 'JWT Token is Missing' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or Expired Token' });
        }

        req.user = user; // Attach user info to the request
        next();
    });
}


module.exports = router;