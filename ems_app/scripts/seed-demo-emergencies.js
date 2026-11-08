// Upserts 10 demo emergencies into the local development database.
// Running it again updates those same records and leaves every other record alone.

const mongoose = require("mongoose");
const { Emergency } = require("../database/models");

const DB_URL = "mongodb://localhost:27017/ems_db";
const DEMO_PATIENT_PREFIX = "demo-patient-";

const demoEmergencies = [
    { index: 1, status: "pending", longitude: -73.5878, latitude: 45.5048, address: "Demo emergency 01 · Parc du Mont-Royal, Montreal" },
    { index: 2, status: "accepted", longitude: -73.5772, latitude: 45.5048, address: "Demo emergency 02 · McGill University, Montreal" },
    { index: 3, status: "pending", longitude: -73.5684, latitude: 45.5081, address: "Demo emergency 03 · Place des Arts, Montreal" },
    { index: 4, status: "accepted", longitude: -73.6150, latitude: 45.5362, address: "Demo emergency 04 · Jean-Talon Market, Montreal" },
    { index: 5, status: "pending", longitude: -73.6086, latitude: 45.5208, address: "Demo emergency 05 · Outremont, Montreal" },
    { index: 6, status: "accepted", longitude: -73.5968, latitude: 45.4838, address: "Demo emergency 06 · Westmount Park, Montreal" },
    { index: 7, status: "pending", longitude: -73.5862, latitude: 45.5322, address: "Demo emergency 07 · Laurier Park, Montreal" },
    { index: 8, status: "accepted", longitude: -73.6002, latitude: 45.5238, address: "Demo emergency 08 · Mile End, Montreal" },
    { index: 9, status: "pending", longitude: -73.6238, latitude: 45.4762, address: "Demo emergency 09 · Notre-Dame-de-Grâce, Montreal" },
    { index: 10, status: "accepted", longitude: -73.5875, latitude: 45.5448, address: "Demo emergency 10 · Beaubien, Rosemont, Montreal" }
];

function demoObjectId(index) {
    const suffix = index.toString(16).padStart(2, "0");
    return new mongoose.Types.ObjectId(`64656d6f00000000000000${suffix}`);
}

function demoPatientId(index) {
    return `${DEMO_PATIENT_PREFIX}${String(index).padStart(2, "0")}`;
}

async function seedDemoEmergencies() {
    await mongoose.connect(DB_URL);

    const otherRecordsBefore = await Emergency.countDocuments({
        patientId: { $not: new RegExp(`^${DEMO_PATIENT_PREFIX}`) }
    });

    for (const emergency of demoEmergencies) {
        const patientId = demoPatientId(emergency.index);
        const update = {
            $set: {
                requestTime: new Date(Date.UTC(2026, 10, 1, 14, emergency.index, 0)),
                location: {
                    address: emergency.address,
                    coordinates: [emergency.longitude, emergency.latitude]
                },
                patientId: patientId,
                status: emergency.status
            }
        };
        if (emergency.status === "accepted") {
            update.$set.paramedicId = "demo-paramedic";
        } else {
            update.$unset = { paramedicId: "" };
        }
        await Emergency.updateOne(
            { _id: demoObjectId(emergency.index) },
            update,
            { upsert: true }
        );
    }

    const otherRecordsAfter = await Emergency.countDocuments({
        patientId: { $not: new RegExp(`^${DEMO_PATIENT_PREFIX}`) }
    });
    if (otherRecordsBefore !== otherRecordsAfter) {
        throw new Error("Seeding changed a non-demo emergency record.");
    }

    const demoRecords = await Emergency.find({
        patientId: new RegExp(`^${DEMO_PATIENT_PREFIX}`)
    }).select("patientId status location.coordinates").lean();

    console.log(`Upserted ${demoEmergencies.length} demo emergencies.`);
    console.log(`Demo records now stored: ${demoRecords.length}.`);
    console.log(`Non-demo emergency records left unchanged: ${otherRecordsAfter}.`);
    console.log(demoRecords.map((record) => ({
        patientId: record.patientId,
        status: record.status,
        coordinates: record.location.coordinates
    })));
}

seedDemoEmergencies()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
