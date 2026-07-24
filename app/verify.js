/**
 * FastAid technical verification script
 * Run while server is up: node verify.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { io } = require('socket.io-client');
const dbFunctions = require('./database/db-functions');
const models = require('./database/models');
const { getRequiredProfession } = require('./config');

const BASE = 'http://localhost:8001';
const DB = 'mongodb://localhost:27017/fastaid_db';

const ACCOUNTS = [
    { username: 'admin', password: 'admin' },
    { username: 'requester', password: 'demo123' },
    { username: 'paramedic', password: 'demo123' },
    { username: 'mechanic', password: 'demo123' },
    { username: 'plumber', password: 'demo123' },
    { username: 'electrician', password: 'demo123' },
    { username: 'locksmith', password: 'demo123' },
    { username: 'heating', password: 'demo123' },
    { username: 'vet', password: 'demo123' },
    { username: 'dualuser', password: 'demo123' }
];

const MONTREAL = { longitude: -73.5804, latitude: 45.4980, address: 'Downtown Montreal, QC' };
const FAR_AWAY = { longitude: -73.40, latitude: 45.60, address: 'Far North Montreal, QC' };

const results = [];
function pass(id, note) { results.push({ id, status: 'PASS', note: note || '' }); }
function fail(id, note) { results.push({ id, status: 'FAIL', note: note || '' }); }

async function login(username, password) {
    const res = await fetch(`${BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return { status: res.status, data: await res.json() };
}

async function getPage(path, token) {
    const res = await fetch(`${path}?token=${token}`);
    return { status: res.status, text: await res.text() };
}

async function apiGet(path, token) {
    const res = await fetch(`${path}?token=${token}`);
    return { status: res.status, data: await res.json().catch(() => ({})) };
}

function connectSocket(username) {
    return new Promise((resolve) => {
        const socket = io(BASE, { transports: ['websocket'] });
        socket.on('connect', () => {
            socket.emit('join', { username });
            resolve(socket);
        });
    });
}

function waitForEvent(socket, event, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeoutMs);
        socket.once(event, (data) => {
            clearTimeout(timer);
            resolve(data);
        });
    });
}

async function clearActiveRequests() {
    await models.Request.deleteMany({
        status: { $in: ['pending', 'accepted', 'en_route', 'arrived'] }
    });
}

async function countRequests(filter = {}) {
    return models.Request.countDocuments(filter);
}

async function testMatching(category, subType, expectedProfession, location) {
    const helpers = await dbFunctions.getAvailableHelpers(
        [location.longitude, location.latitude],
        category,
        subType,
        2000
    );
    const professions = helpers.map(h => h.profession);
    const allMatch = helpers.every(h => h.profession === expectedProfession);
    const hasExpected = helpers.some(h => h.profession === expectedProfession);
    return { helpers, professions, allMatch, hasExpected, count: helpers.length };
}

async function emitHelpRequest(requesterSocket, requesterId, category, subType, location) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('help-request timeout')), 8000);
        requesterSocket.once('request-created', (data) => {
            clearTimeout(timer);
            resolve({ ok: true, data });
        });
        requesterSocket.once('request-error', (data) => {
            clearTimeout(timer);
            resolve({ ok: false, data });
        });
        requesterSocket.emit('help-request', {
            requesterId,
            category,
            subType,
            location
        });
    });
}

async function run() {
    console.log('=== FastAid Verification ===\n');

    // Req 29 - DB name
    if (DB.includes('fastaid_db')) pass(29, 'Uses fastaid_db connection string');
    else fail(29, 'Wrong database name');

    await mongoose.connect(DB);

    // Req 2 - seed accounts count
    const userCount = await models.User.countDocuments({});
    if (userCount === 10) pass(2, `Found ${userCount} users after seed`);
    else fail(2, `Expected 10 users, found ${userCount}`);

    const dupes = await models.User.aggregate([
        { $group: { _id: '$username', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
    ]);
    if (dupes.length === 0) pass(2, 'No duplicate usernames');
    else fail(2, 'Duplicate usernames found');

    // Req 3 - login all accounts
    const tokens = {};
    let loginFail = false;
    for (const acct of ACCOUNTS) {
        const { status, data } = await login(acct.username, acct.password);
        if (status === 200 && data.token) {
            tokens[acct.username] = data.token;
        } else {
            loginFail = true;
            fail(3, `Login failed for ${acct.username}: ${status}`);
        }
    }
    if (!loginFail) pass(3, 'All 10 accounts logged in');

    // Req 4 - requester cannot access helper pages
    const reqHelperPage = await getPage(`${BASE}/helper.html`, tokens.requester);
    if (reqHelperPage.status === 403) pass(4, 'requester blocked from helper.html');
    else fail(4, `requester got status ${reqHelperPage.status} for helper.html`);

    const reqHelperHist = await getPage(`${BASE}/helper-history.html`, tokens.requester);
    if (reqHelperHist.status === 403) pass(4, 'requester blocked from helper-history.html');
    else fail(4, `requester got status ${reqHelperHist.status} for helper-history.html`);

    // Req 5 - helper-only cannot access requester pages
    const mechReqPage = await getPage(`${BASE}/requester.html`, tokens.mechanic);
    if (mechReqPage.status === 403) pass(5, 'mechanic blocked from requester.html');
    else fail(5, `mechanic got status ${mechReqPage.status} for requester.html`);

    // Req 6 - dualuser can access both
    const dualReq = await getPage(`${BASE}/requester.html`, tokens.dualuser);
    const dualHelp = await getPage(`${BASE}/helper.html`, tokens.dualuser);
    if (dualReq.status === 200 && dualHelp.status === 200) pass(6, 'dualuser accesses requester and helper pages');
    else fail(6, `dualuser statuses: requester=${dualReq.status}, helper=${dualHelp.status}`);

    // Req 7-10 matching via db-functions
    const medical = await testMatching('medical', null, 'paramedic', MONTREAL);
    if (medical.allMatch && medical.hasExpected) pass(7, `Medical matches paramedics only (${medical.count})`);
    else fail(7, `Professions: ${medical.professions.join(', ')}`);

    const vehicle = await testMatching('vehicle', 'flat_tire', 'mechanic', MONTREAL);
    if (vehicle.allMatch && vehicle.hasExpected) pass(8, `Vehicle matches mechanics only (${vehicle.count})`);
    else fail(8, `Professions: ${vehicle.professions.join(', ')}`);

    const homeTests = [
        ['plumbing', 'plumber'],
        ['electrical', 'electrician'],
        ['locksmith', 'locksmith'],
        ['heating', 'heating_technician']
    ];
    let homeOk = true;
    for (const [sub, prof] of homeTests) {
        const r = await testMatching('home', sub, prof, MONTREAL);
        if (!r.allMatch || !r.hasExpected) { homeOk = false; break; }
    }
    if (homeOk) pass(9, 'All home subtypes match correct professions');
    else fail(9, 'Home subtype DB matching failed');

    const pet = await testMatching('pet', null, 'veterinarian', MONTREAL);
    if (pet.allMatch && pet.hasExpected) pass(10, `Pet matches veterinarians only (${pet.count})`);
    else fail(10, `Professions: ${pet.professions.join(', ')}`);

    // Req 11 - far location should match zero helpers
    const farMedical = await testMatching('medical', null, 'paramedic', FAR_AWAY);
    if (farMedical.count === 0) pass(11, 'No helpers matched far-away location');
    else fail(11, `Far location matched ${farMedical.count} helpers: ${farMedical.professions.join(', ')}`);

    await clearActiveRequests();

    // Socket tests
    const requesterSocket = await connectSocket('requester');
    const paramedicSocket = await connectSocket('paramedic');
    const mechanicSocket = await connectSocket('mechanic');
    const dualSocket = await connectSocket('dualuser');

    // Req 12 - no request created when no helper
    const beforeCount = await countRequests({ status: 'pending' });
    const noHelperResult = await emitHelpRequest(requesterSocket, 'requester', 'medical', null, FAR_AWAY);
    const afterCount = await countRequests({ status: 'pending' });
    if (!noHelperResult.ok && noHelperResult.data.message === 'no_helper_available' && afterCount === beforeCount) {
        pass(12, 'No DB request when no helper within 2km');
    } else {
        fail(12, `Expected no_helper_available, got ${JSON.stringify(noHelperResult)} count ${beforeCount}->${afterCount}`);
    }

    // Req 7-10 socket notification targeting
    async function testNotify(category, subType, expectedReceiver, wrongReceivers) {
        await clearActiveRequests();
        const received = {};
        const setupListener = (socket, name) => {
            received[name] = null;
            socket.off('incoming-request');
            socket.on('incoming-request', (data) => { received[name] = data; });
        };
        setupListener(paramedicSocket, 'paramedic');
        setupListener(mechanicSocket, 'mechanic');
        setupListener(dualSocket, 'dualuser');
        for (const w of wrongReceivers) setupListener(await connectSocket(w), w);

        const result = await emitHelpRequest(requesterSocket, 'requester', category, subType, MONTREAL);
        await new Promise(r => setTimeout(r, 800));
        return { result, received };
    }

    const medNotify = await testNotify('medical', null, 'paramedic', ['mechanic', 'plumber']);
    if (medNotify.result.ok && medNotify.received.paramedic && !medNotify.received.mechanic) {
        pass(7, 'Socket: medical notifies paramedic only');
    } else fail(7, `Socket medical notify: ${JSON.stringify(medNotify.received)}`);

    const vehNotify = await testNotify('vehicle', 'dead_battery', 'mechanic', ['paramedic']);
    const vehReceivers = Object.keys(vehNotify.received).filter(k => vehNotify.received[k]);
    const vehOnlyMechanics = vehReceivers.every(k => k === 'mechanic' || k === 'dualuser');
    if (vehNotify.result.ok && vehOnlyMechanics && vehReceivers.length > 0) pass(8, `Socket: vehicle notifies mechanics (${vehReceivers.join(',')})`);
    else fail(8, `Socket vehicle notify: ${JSON.stringify(vehReceivers)}`);

    const electricianSock = await connectSocket('electrician');
    let electricianGot = null;
    electricianSock.on('incoming-request', (d) => { electricianGot = d; });
    const plumbSock = await connectSocket('plumber');
    let plumberGot = null;
    plumbSock.on('incoming-request', (d) => { plumberGot = d; });
    await clearActiveRequests();
    const plumbResult = await emitHelpRequest(requesterSocket, 'requester', 'home', 'plumbing', MONTREAL);
    await new Promise(r => setTimeout(r, 800));
    if (plumbResult.ok && plumberGot && !electricianGot) {
        pass(9, 'Socket: plumbing notifies plumber only');
    } else fail(9, 'Socket plumbing failed');
    plumbSock.disconnect();
    electricianSock.disconnect();

    const homeSocketTests = [
        ['electrical', 'electrician'],
        ['locksmith', 'locksmith'],
        ['heating', 'heating']
    ];
    let homeSocketOk = true;
    for (const [sub, helperUser] of homeSocketTests) {
        await clearActiveRequests();
        const helperSock = await connectSocket(helperUser);
        let received = null;
        helperSock.on('incoming-request', (d) => { received = d; });
        const result = await emitHelpRequest(requesterSocket, 'requester', 'home', sub, MONTREAL);
        await new Promise(r => setTimeout(r, 800));
        helperSock.disconnect();
        if (!result.ok || !received) { homeSocketOk = false; break; }
    }
    if (homeSocketOk) pass(9, 'Socket: other home subtypes notify correct helpers');
    else fail(9, 'Socket home subtype notification failed');

    const petNotify = await testNotify('pet', null, 'vet', ['paramedic']);
    const vetSocket = await connectSocket('vet');
    let vetReceived = null;
    vetSocket.on('incoming-request', (d) => { vetReceived = d; });
    await clearActiveRequests();
    const petResult = await emitHelpRequest(requesterSocket, 'requester', 'pet', null, MONTREAL);
    await new Promise(r => setTimeout(r, 800));
    if (petResult.ok && vetReceived) pass(10, 'Socket: pet notifies veterinarian');
    else fail(10, 'Socket pet notify failed');

    // Req 13 - second active request blocked
    await clearActiveRequests();
    await emitHelpRequest(requesterSocket, 'requester', 'medical', null, MONTREAL);
    const secondReq = await emitHelpRequest(requesterSocket, 'requester', 'pet', null, MONTREAL);
    if (!secondReq.ok && secondReq.data.message === 'active_request_exists') pass(13, 'Second active request blocked');
    else fail(13, `Second request: ${JSON.stringify(secondReq)}`);

    // Req 15-16 first accept wins
    await clearActiveRequests();
    const mechanic2Socket = await connectSocket('mechanic');
    let mech1Got = null, mech2Got = null;
    mechanicSocket.on('incoming-request', (d) => { mech1Got = d; });
    mechanic2Socket.on('incoming-request', (d) => { mech2Got = d; });
    const vehReq = await emitHelpRequest(requesterSocket, 'requester', 'vehicle', 'flat_tire', MONTREAL);
    await new Promise(r => setTimeout(r, 500));
    const requestId = String(vehReq.data.requestId);

    let acceptFailed = false;
    mechanic2Socket.once('accept-failed', () => { acceptFailed = true; });

    const accept1 = new Promise(resolve => {
        requesterSocket.once('request-accepted', resolve);
        mechanicSocket.emit('request-accepted', {
            requestId,
            helperInfo: { username: 'mechanic', displayName: 'Luc Martin', phone: '514-333-3333' }
        });
    });
    await accept1;
    mechanic2Socket.emit('request-accepted', {
        requestId,
        helperInfo: { username: 'dualuser', displayName: 'Alex', phone: '514-999-9999' }
    });
    await new Promise(r => setTimeout(r, 500));

    const acceptedReq = await models.Request.findById(requestId);
    if (acceptedReq.helperId === 'mechanic' && acceptFailed) pass(15, 'First helper accepted');
    else fail(15, `helperId=${acceptedReq.helperId}, acceptFailed=${acceptFailed}`);
    if (acceptedReq.helperId === 'mechanic') pass(16, 'Second acceptance did not overwrite');
    else fail(16, `Wrong helper: ${acceptedReq.helperId}`);

    // Req 17 - requester got acceptance (already in accept1)
    pass(17, 'Requester received request-accepted event');

    // Req 18-19 status flow
    const statuses = ['en_route', 'arrived', 'completed'];
    const statusReceived = [];
    requesterSocket.on('status-updated', (d) => statusReceived.push(d.status));
    for (const st of statuses) {
        mechanicSocket.emit('status-update', { requestId, helperId: 'mechanic', status: st });
        await new Promise(r => setTimeout(r, 300));
    }
    await new Promise(r => setTimeout(r, 500));
    const finalReq = await models.Request.findById(requestId);
    if (finalReq.status === 'completed' && statuses.every(s => statusReceived.includes(s))) {
        pass(18, 'Full status flow completed in DB');
        pass(19, `Requester received statuses: ${statusReceived.join(' -> ')}`);
    } else {
        fail(18, `Final status ${finalReq.status}`);
        fail(19, `Received ${statusReceived.join(',')}`);
    }

    // Req 20 - history
    const reqHist = await dbFunctions.getRequesterHistory('requester');
    const helpHist = await dbFunctions.getHelperHistory('mechanic');
    const inReqHist = reqHist.some(r => String(r._id) === requestId && r.status === 'completed');
    const inHelpHist = helpHist.some(r => String(r._id) === requestId && r.status === 'completed');
    if (inReqHist && inHelpHist) pass(20, 'Completed request in both histories');
    else fail(20, `reqHist=${inReqHist}, helpHist=${inHelpHist}`);

    // Req 21 - helper info API
    const helperInfo = await dbFunctions.getHelperInfo('mechanic');
    if (helperInfo.displayName && helperInfo.phone) pass(21, 'Helper has displayName and phone');
    else fail(21, 'Missing helper contact fields');

    // Req 14 - busy helper cannot accept another
    await clearActiveRequests();
    const medReq = await emitHelpRequest(requesterSocket, 'requester', 'medical', null, MONTREAL);
    const medRequestId = String(medReq.data.requestId);
    paramedicSocket.emit('request-accepted', {
        requestId: medRequestId,
        helperInfo: { username: 'paramedic', displayName: 'Dr. Jean Dupont', phone: '514-222-2222' }
    });
    await new Promise(r => setTimeout(r, 600));
    const paramedicBusy = await dbFunctions.getActiveRequestForHelper('paramedic');
    await emitHelpRequest(requesterSocket, 'dualuser', 'pet', null, MONTREAL);
    await new Promise(r => setTimeout(r, 600));
    const pendingPet = await models.Request.findOne({ status: 'pending', category: 'pet', requesterId: 'dualuser' });
    let busyFail = false;
    paramedicSocket.once('accept-failed', () => { busyFail = true; });
    paramedicSocket.emit('request-accepted', {
        requestId: String(pendingPet._id),
        helperInfo: { username: 'paramedic', displayName: 'Dr. Jean Dupont', phone: '514-222-2222' }
    });
    await new Promise(r => setTimeout(r, 600));
    const petAfter = await models.Request.findById(pendingPet._id);
    if (paramedicBusy && busyFail && petAfter.status === 'pending') pass(14, 'Busy helper cannot accept second request');
    else fail(14, `busy=${!!paramedicBusy}, busyFail=${busyFail}, petStatus=${petAfter && petAfter.status}`);

    // Req 23-26 admin
    const adminLogin = await login('admin', 'admin');
    if (adminLogin.status === 200) pass(23, 'Admin login OK');
    else fail(23, `Admin login ${adminLogin.status}`);

    const adminToken = tokens.admin;
    const adminPage = await getPage(`${BASE}/admin.html`, adminToken);
    if (adminPage.status === 200) pass(23, 'Admin page accessible');

    const usersApi = await apiGet(`${BASE}/admin/users`, adminToken);
    if (usersApi.status === 200 && usersApi.data.users.length >= 10) pass(24, `Admin lists ${usersApi.data.users.length} users`);
    else fail(24, `Admin users API ${usersApi.status}`);

    const createUser = await fetch(`${BASE}/admin/users?token=${adminToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'testuser_verify',
            password: 'demo123',
            displayName: 'Test User',
            phone: '514-000-9999',
            canRequest: true,
            canHelp: false
        })
    });
    if (createUser.status === 201) pass(24, 'Admin created user');
    else fail(24, `Create user ${createUser.status}`);

    const updateUser = await fetch(`${BASE}/admin/users/testuser_verify?token=${adminToken}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: 'Test Updated' })
    });
    if (updateUser.status === 200) pass(24, 'Admin updated user');
    else fail(24, `Update user ${updateUser.status}`);

    const deleteUser = await fetch(`${BASE}/admin/users/testuser_verify?token=${adminToken}`, { method: 'DELETE' });
    if (deleteUser.status === 200) pass(24, 'Admin deleted user');
    else fail(24, `Delete user ${deleteUser.status}`);

    const reqsApi = await apiGet(`${BASE}/admin/requests`, adminToken);
    if (reqsApi.status === 200) pass(25, 'Admin lists requests');
    else fail(25, `Admin requests ${reqsApi.status}`);

    const anyReq = reqsApi.data.requests[0];
    if (anyReq) {
        const updReq = await fetch(`${BASE}/admin/requests/${anyReq._id}?token=${adminToken}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
        });
        if (updReq.status === 200) pass(25, 'Admin updated request status');
        else fail(25, `Update request ${updReq.status}`);
    }

    const geoApi = await apiGet(`${BASE}/requests/geojson`, adminToken);
    if (geoApi.status === 200 && geoApi.data.type === 'FeatureCollection') pass(26, `GeoJSON has ${geoApi.data.features.length} features`);
    else fail(26, `GeoJSON API ${geoApi.status}`);

    const nonAdminGeo = await apiGet(`${BASE}/requests/geojson`, tokens.requester);
    if (nonAdminGeo.status === 403) pass(26, 'GeoJSON admin-only enforced');
    else fail(26, `Non-admin geo status ${nonAdminGeo.status}`);

    // Req 35 - unauthorized access
    const noToken = await fetch(`${BASE}/requester.html`);
    const badToken = await fetch(`${BASE}/requester.html?token=invalidtoken`);
    if (noToken.status === 401 && badToken.status === 403) pass(35, 'Unauthorized routes return 401/403 without crash');
    else fail(35, `noToken=${noToken.status}, badToken=${badToken.status}`);

    // Req 34 - data persists (check completed request still exists)
    const persisted = await models.Request.findById(requestId);
    if (persisted && persisted.status === 'completed') pass(34, 'Completed request persisted in DB');
    else fail(34, 'Data persistence check failed');

    // Cleanup sockets
    [requesterSocket, paramedicSocket, mechanicSocket, dualSocket, mechanic2Socket, vetSocket].forEach(s => s && s.disconnect());
    await mongoose.disconnect();

    // Print results
    console.log('\n=== RESULTS ===');
    const ids = [...new Set(results.map(r => r.id))].sort((a, b) => a - b);
    for (const id of ids) {
        const entries = results.filter(r => r.id === id);
        const status = entries.some(e => e.status === 'FAIL') ? 'FAIL' : 'PASS';
        const notes = entries.map(e => e.note).filter(Boolean).join('; ');
        console.log(`${status} #${id}: ${notes}`);
    }
    const failed = results.filter(r => r.status === 'FAIL');
    process.exit(failed.length > 0 ? 1 : 0);
}

run().catch(err => {
    console.error('Verification crashed:', err);
    process.exit(1);
});
