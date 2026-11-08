// Mongoose Models 
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// PATIENT MODEL
const patientSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }
});

// Pre-save hook to hash the password before saving
patientSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

const Patient = mongoose.model('Patient', patientSchema); // Create Mongoose Model based off schema


// PARAMEDIC MODEL
const paramedicSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String },
    location: { // GeoJSON object with Point type
        type: {
            type: String,
            required: true,
            default: "Point"
        },
        address: { type: String },
        coordinates: [Number],
    }
});

// Pre-save hook to hash the password before saving
paramedicSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

paramedicSchema.index({ "location": "2dsphere", username: 1 }); // Geospatial index to query based on spatial data (optimize queries on GeoJSON objects)
const Paramedic = mongoose.model('Paramedic', paramedicSchema);


// EMERGENCY MODEL
const emergencySchema = mongoose.Schema({
    requestTime: { type: Date },
    location: {
        address: { type: String },
        coordinates: [Number]
    },
    patientId: { type: String }, // Patient username
    paramedicId: { type: String }, // Paramedic username
    status: { type: String } //pending or accepted
})

const Emergency = mongoose.model('Emergency', emergencySchema);


exports.Patient = Patient;
exports.Paramedic = Paramedic;
exports.Emergency = Emergency;