const models = require('./models.js');
const User = models.User;
const Request = models.Request;
const {
    ACTIVE_REQUESTER_STATUSES,
    ACTIVE_HELPER_STATUSES,
    getRequiredProfession
} = require('../config.js');

// Return available helpers within range for a category/subtype
async function getAvailableHelpers(coordinates, category, subType, maxRange) {
    const profession = getRequiredProfession(category, subType);
    if (!profession) return [];

    const busyHelperIds = await Request.find({
        helperId: { $ne: null },
        status: { $in: ACTIVE_HELPER_STATUSES }
    }).distinct('helperId');

    return User.find({
        canHelp: true,
        profession: profession,
        username: { $nin: busyHelperIds },
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: coordinates
                },
                $maxDistance: maxRange
            }
        }
    }).exec().catch(error => {
        console.log(error);
        return [];
    });
}

function getUserByUsername(username) {
    return User.findOne({ username: username }).exec().catch(error => {
        console.log(error);
        return null;
    });
}

function getHelperInfo(username) {
    return User.findOne({ username: username }, {
        username: 1,
        displayName: 1,
        phone: 1,
        profession: 1,
        location: 1
    }).exec().catch(error => {
        console.log(error);
        return null;
    });
}

function saveRequest(requestId, requestTime, category, subType, location, requesterId, status) {
    const request = new Request({
        _id: requestId,
        requestTime: requestTime,
        category: category,
        subType: subType,
        location: location,
        requesterId: requesterId,
        status: status
    });

    return request.save().catch(error => {
        console.log(error);
        return null;
    });
}

function acceptRequest(requestId, helperId) {
    return Request.findOneAndUpdate(
        { _id: requestId, status: 'pending', helperId: null },
        { status: 'accepted', helperId: helperId },
        { new: true }
    ).catch(error => {
        console.log(error);
        return null;
    });
}

function updateRequestStatus(requestId, helperId, status) {
    return Request.findOneAndUpdate(
        { _id: requestId, helperId: helperId },
        { status: status },
        { new: true }
    ).catch(error => {
        console.log(error);
        return null;
    });
}

function getRequest(requestId) {
    return Request.findOne({ _id: requestId }).catch(error => {
        console.log(error);
        return null;
    });
}

function getActiveRequestForRequester(username) {
    return Request.findOne({
        requesterId: username,
        status: { $in: ACTIVE_REQUESTER_STATUSES }
    }).catch(error => {
        console.log(error);
        return null;
    });
}

function getActiveRequestForHelper(username) {
    return Request.findOne({
        helperId: username,
        status: { $in: ACTIVE_HELPER_STATUSES }
    }).catch(error => {
        console.log(error);
        return null;
    });
}

async function getAllRequests() {
    try {
        return await Request.find({}).sort({ requestTime: -1 }).lean().exec();
    } catch (error) {
        console.log(error);
        return [];
    }
}

async function getRequestsGeoJson() {
    try {
        const requests = await Request.find({}, {
            requestTime: 1,
            status: 1,
            category: 1,
            subType: 1,
            location: 1,
            _id: 0
        }).exec();

        const features = requests.map(item => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: item.location.coordinates
            },
            properties: {
                status: item.status,
                category: item.category,
                subType: item.subType,
                requestTime: item.requestTime,
                address: item.location.address
            }
        }));

        return { type: 'FeatureCollection', features: features };
    } catch (error) {
        console.log(error);
        return { type: 'FeatureCollection', features: [] };
    }
}

function getRequesterHistory(username) {
    return Request.find({ requesterId: username }, {
        category: 1,
        subType: 1,
        'location.address': 1,
        requestTime: 1,
        status: 1,
        helperId: 1
    }).sort({ requestTime: -1 }).lean().exec().catch(error => {
        console.log(error);
        return [];
    });
}

function getHelperHistory(username) {
    return Request.find({ helperId: username }, {
        requesterId: 1,
        category: 1,
        subType: 1,
        'location.address': 1,
        requestTime: 1,
        status: 1
    }).sort({ requestTime: -1 }).lean().exec().catch(error => {
        console.log(error);
        return [];
    });
}

async function getAllUsers() {
    try {
        return await User.find({}, { password: 0 }).lean().exec();
    } catch (error) {
        console.log(error);
        return [];
    }
}

function deleteRequest(requestId) {
    return Request.findByIdAndDelete(requestId).catch(error => {
        console.log(error);
        return null;
    });
}

function adminUpdateRequest(requestId, updates) {
    return Request.findByIdAndUpdate(requestId, updates, { new: true }).catch(error => {
        console.log(error);
        return null;
    });
}

function createUser(userData) {
    const user = new User(userData);
    return user.save().catch(error => {
        console.log(error);
        return null;
    });
}

function updateUser(username, updates) {
    return User.findOneAndUpdate({ username: username }, updates, { new: true, fields: { password: 0 } }).catch(error => {
        console.log(error);
        return null;
    });
}

function deleteUser(username) {
    return User.findOneAndDelete({ username: username }).catch(error => {
        console.log(error);
        return null;
    });
}

exports.getAvailableHelpers = getAvailableHelpers;
exports.getUserByUsername = getUserByUsername;
exports.getHelperInfo = getHelperInfo;
exports.saveRequest = saveRequest;
exports.acceptRequest = acceptRequest;
exports.updateRequestStatus = updateRequestStatus;
exports.getRequest = getRequest;
exports.getActiveRequestForRequester = getActiveRequestForRequester;
exports.getActiveRequestForHelper = getActiveRequestForHelper;
exports.getAllRequests = getAllRequests;
exports.getRequestsGeoJson = getRequestsGeoJson;
exports.getRequesterHistory = getRequesterHistory;
exports.getHelperHistory = getHelperHistory;
exports.getAllUsers = getAllUsers;
exports.deleteRequest = deleteRequest;
exports.adminUpdateRequest = adminUpdateRequest;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
