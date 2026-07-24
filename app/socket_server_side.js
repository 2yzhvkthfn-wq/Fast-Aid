// Socket IO server-side

const dbFunctions = require('./database/db-functions');
const mongoose = require('mongoose');

function setUp(server) {
    const io = require('socket.io')(server);

    io.on('connection', (socket) => {
        socket.on('join', (data) => {
            socket.join(data.username);
            console.log(`User joined room: ${data.username}`);
        });

        socket.on('help-request', async (requestInfo) => {
            const location = {
                coordinates: [requestInfo.location.longitude, requestInfo.location.latitude],
                address: requestInfo.location.address
            };

            const activeRequest = await dbFunctions.getActiveRequestForRequester(requestInfo.requesterId);
            if (activeRequest) {
                socket.emit('request-error', { message: 'active_request_exists' });
                return;
            }

            const helpers = await dbFunctions.getAvailableHelpers(location.coordinates, requestInfo.category, requestInfo.subType, 2000);
            if (!helpers || helpers.length === 0) {
                socket.emit('request-error', { message: 'no_helper_available' });
                return;
            }

            const requestTime = new Date();
            const requestId = new mongoose.Types.ObjectId();

            requestInfo.requestId = requestId;
            requestInfo.requestTime = requestTime;

            await dbFunctions.saveRequest(
                requestId,
                requestTime,
                requestInfo.category,
                requestInfo.subType || null,
                location,
                requestInfo.requesterId,
                'pending'
            );

            for (let i = 0; i < helpers.length; i++) {
                console.log(`Sending request to helper ${helpers[i].username}`);
                io.sockets.in(helpers[i].username).emit('incoming-request', requestInfo);
            }

            socket.emit('request-created', requestInfo);
        });

        socket.on('request-accepted', async (info) => {
            const activeForHelper = await dbFunctions.getActiveRequestForHelper(info.helperInfo.username);
            if (activeForHelper) {
                socket.emit('accept-failed', { message: 'helper_busy' });
                return;
            }

            const updated = await dbFunctions.acceptRequest(info.requestId, info.helperInfo.username);
            if (!updated) {
                socket.emit('accept-failed', { message: 'already_accepted' });
                return;
            }

            const requestInfo = await dbFunctions.getRequest(info.requestId);
            console.log(`Helper ${info.helperInfo.username} accepted request ${info.requestId}`);

            io.sockets.in(requestInfo.requesterId).emit('request-accepted', {
                helperInfo: info.helperInfo,
                requestId: info.requestId
            });

            io.emit('request-taken', { requestId: info.requestId });
        });

        socket.on('status-update', async (info) => {
            const updated = await dbFunctions.updateRequestStatus(info.requestId, info.helperId, info.status);
            if (!updated) return;

            const requestInfo = await dbFunctions.getRequest(info.requestId);
            io.sockets.in(requestInfo.requesterId).emit('status-updated', {
                requestId: info.requestId,
                status: info.status
            });
            io.sockets.in(info.helperId).emit('status-updated', {
                requestId: info.requestId,
                status: info.status
            });
        });
    });
}

exports.setUp = setUp;
