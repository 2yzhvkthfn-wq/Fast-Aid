// Mongoose Models
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    canRequest: { type: Boolean, default: true },
    canHelp: { type: Boolean, default: false },
    profession: { type: String, default: null },
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        address: { type: String },
        coordinates: [Number]
    }
});

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.index({ location: '2dsphere' }, { sparse: true });

const User = mongoose.model('User', userSchema);


const requestSchema = mongoose.Schema({
    requestTime: { type: Date, default: Date.now },
    category: { type: String, required: true },
    subType: { type: String, default: null },
    location: {
        address: { type: String },
        coordinates: [Number]
    },
    requesterId: { type: String, required: true },
    helperId: { type: String, default: null },
    status: { type: String, default: 'pending' }
});

const Request = mongoose.model('Request', requestSchema);


exports.User = User;
exports.Request = Request;
