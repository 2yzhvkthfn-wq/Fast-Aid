// API endpoints

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const dbFunctions = require('./database/db-functions.js');
const models = require('./database/models.js');
const User = models.User;
const { STATUSES } = require('./config.js');

const mapboxToken = process.env.MAPBOX_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;


router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'invalid_username' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'invalid_password' });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                isAdmin: user.isAdmin,
                canRequest: user.canRequest,
                canHelp: user.canHelp,
                profession: user.profession
            },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.status(200).json({
            token: token,
            isAdmin: user.isAdmin,
            canRequest: user.canRequest,
            canHelp: user.canHelp
        });
    } catch (error) {
        res.status(500).json({ error: 'login_failed' });
    }
});


router.get('/helpers/info', authenticateJWT, async (req, res) => {
    const helperDetails = await dbFunctions.getHelperInfo(req.query.username);
    res.json({ helperDetails: helperDetails });
});


router.get('/requests/active/requester', authenticateJWT, async (req, res) => {
    const request = await dbFunctions.getActiveRequestForRequester(req.user.username);
    res.json({ request: request });
});


router.get('/requests/active/helper', authenticateJWT, async (req, res) => {
    const request = await dbFunctions.getActiveRequestForHelper(req.user.username);
    res.json({ request: request });
});


router.get('/requests/geojson', authenticateJWT, requireAdmin, async (req, res) => {
    const geojson = await dbFunctions.getRequestsGeoJson();
    res.json(geojson);
});


// Admin API
router.get('/admin/users', authenticateJWT, requireAdmin, async (req, res) => {
    const users = await dbFunctions.getAllUsers();
    res.json({ users: users });
});

router.get('/admin/requests', authenticateJWT, requireAdmin, async (req, res) => {
    const requests = await dbFunctions.getAllRequests();
    res.json({ requests: requests });
});

router.post('/admin/users', authenticateJWT, requireAdmin, async (req, res) => {
    const user = await dbFunctions.createUser(req.body);
    if (!user) return res.status(400).json({ error: 'create_failed' });
    res.status(201).json({ user: { username: user.username } });
});

router.put('/admin/users/:username', authenticateJWT, requireAdmin, async (req, res) => {
    const updates = { ...req.body };
    delete updates.username;
    if (updates.password === '') delete updates.password;
    const user = await dbFunctions.updateUser(req.params.username, updates);
    if (!user) return res.status(404).json({ error: 'not_found' });
    res.json({ user: user });
});

router.delete('/admin/users/:username', authenticateJWT, requireAdmin, async (req, res) => {
    if (req.params.username === 'admin') {
        return res.status(400).json({ error: 'cannot_delete_admin' });
    }
    await dbFunctions.deleteUser(req.params.username);
    res.json({ success: true });
});

router.put('/admin/requests/:id', authenticateJWT, requireAdmin, async (req, res) => {
    const { status, helperId } = req.body;
    const updates = {};
    if (status && STATUSES.includes(status)) updates.status = status;
    if (helperId !== undefined) updates.helperId = helperId || null;
    const request = await dbFunctions.adminUpdateRequest(req.params.id, updates);
    if (!request) return res.status(404).json({ error: 'not_found' });
    res.json({ request: request });
});

router.delete('/admin/requests/:id', authenticateJWT, requireAdmin, async (req, res) => {
    await dbFunctions.deleteRequest(req.params.id);
    res.json({ success: true });
});


// Page Rendering
router.get('/', (req, res) => {
    res.render('index.html');
});

router.get('/requester.html', authenticateJWT, requireCanRequest, (req, res) => {
    res.render('requester.html', {
        username: req.user.username,
        token: req.query.token,
        mapboxToken: mapboxToken,
        canHelp: req.user.canHelp
    });
});

router.get('/helper.html', authenticateJWT, requireCanHelp, (req, res) => {
    res.render('helper.html', {
        username: req.user.username,
        token: req.query.token,
        mapboxToken: mapboxToken,
        canRequest: req.user.canRequest
    });
});

router.get('/requester-history.html', authenticateJWT, requireCanRequest, async (req, res) => {
    const history = await dbFunctions.getRequesterHistory(req.user.username);
    res.render('requester-history.html', {
        username: req.user.username,
        token: req.query.token,
        canHelp: req.user.canHelp,
        history: history
    });
});

router.get('/helper-history.html', authenticateJWT, requireCanHelp, async (req, res) => {
    const history = await dbFunctions.getHelperHistory(req.user.username);
    res.render('helper-history.html', {
        username: req.user.username,
        token: req.query.token,
        canRequest: req.user.canRequest,
        history: history
    });
});

router.get('/admin.html', authenticateJWT, requireAdmin, (req, res) => {
    res.render('admin.html', {
        username: req.user.username,
        token: req.query.token,
        mapboxToken: mapboxToken
    });
});


function authenticateJWT(req, res, next) {
    const token = req.query.token;

    if (!token) {
        return res.status(401).json({ message: 'token_missing' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'invalid_token' });
        }
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'admin_only' });
    }
    next();
}

function requireCanRequest(req, res, next) {
    if (!req.user.canRequest && !req.user.isAdmin) {
        return res.status(403).json({ message: 'requester_only' });
    }
    next();
}

function requireCanHelp(req, res, next) {
    if (!req.user.canHelp && !req.user.isAdmin) {
        return res.status(403).json({ message: 'helper_only' });
    }
    next();
}


module.exports = router;
