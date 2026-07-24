// Seed demonstration data for FastAid
require('dotenv').config();
const mongoose = require('mongoose');
const models = require('./database/models.js');
const User = models.User;
const Request = models.Request;

const db = 'mongodb://localhost:27017/fastaid_db';

// Downtown Montreal area coordinates for 2 km demo matching
const demoLocation = (lng, lat, address) => ({
    type: 'Point',
    address: address,
    coordinates: [lng, lat]
});

async function seed() {
    await mongoose.connect(db);
    console.log('Connected to fastaid_db');

    await User.deleteMany({});
    await Request.deleteMany({});
    console.log('Cleared existing data');

    const users = [
        {
            username: 'admin',
            password: 'admin',
            displayName: 'FastAid Admin',
            phone: '514-000-0000',
            isAdmin: true,
            canRequest: false,
            canHelp: false
        },
        {
            username: 'requester',
            password: 'demo123',
            displayName: 'Marie Tremblay',
            phone: '514-111-1111',
            canRequest: true,
            canHelp: false
        },
        {
            username: 'paramedic',
            password: 'demo123',
            displayName: 'Dr. Jean Dupont',
            phone: '514-222-2222',
            canRequest: false,
            canHelp: true,
            profession: 'paramedic',
            location: demoLocation(-73.5750, 45.4990, 'Downtown Montreal, QC')
        },
        {
            username: 'mechanic',
            password: 'demo123',
            displayName: 'Luc Martin',
            phone: '514-333-3333',
            canRequest: false,
            canHelp: true,
            profession: 'mechanic',
            location: demoLocation(-73.5820, 45.4960, 'Golden Square Mile, Montreal, QC')
        },
        {
            username: 'plumber',
            password: 'demo123',
            displayName: 'Pierre Leblanc',
            phone: '514-444-4444',
            canRequest: false,
            canHelp: true,
            profession: 'plumber',
            location: demoLocation(-73.5780, 45.5010, 'Milton-Parc, Montreal, QC')
        },
        {
            username: 'electrician',
            password: 'demo123',
            displayName: 'Sophie Gagnon',
            phone: '514-555-5555',
            canRequest: false,
            canHelp: true,
            profession: 'electrician',
            location: demoLocation(-73.5840, 45.5000, 'McGill Ghetto, Montreal, QC')
        },
        {
            username: 'locksmith',
            password: 'demo123',
            displayName: 'Marc Bergeron',
            phone: '514-666-6666',
            canRequest: false,
            canHelp: true,
            profession: 'locksmith',
            location: demoLocation(-73.5710, 45.4970, 'Quartier des Spectacles, Montreal, QC')
        },
        {
            username: 'heating',
            password: 'demo123',
            displayName: 'Andre Roy',
            phone: '514-777-7777',
            canRequest: false,
            canHelp: true,
            profession: 'heating_technician',
            location: demoLocation(-73.5860, 45.4940, 'Shaughnessy Village, Montreal, QC')
        },
        {
            username: 'vet',
            password: 'demo123',
            displayName: 'Dr. Isabelle Cote',
            phone: '514-888-8888',
            canRequest: false,
            canHelp: true,
            profession: 'veterinarian',
            location: demoLocation(-73.5730, 45.5020, 'Plateau Mont-Royal, Montreal, QC')
        },
        {
            username: 'dualuser',
            password: 'demo123',
            displayName: 'Alex Nasrallah',
            phone: '514-999-9999',
            canRequest: true,
            canHelp: true,
            profession: 'mechanic',
            location: demoLocation(-73.5790, 45.4975, 'Downtown Montreal, QC')
        }
    ];

    for (const userData of users) {
        const user = new User(userData);
        await user.save();
        console.log(`Created user: ${userData.username}`);
    }

    // Sample completed requests for history demonstration
    const sampleRequests = [
        {
            requestTime: new Date('2025-06-01T14:30:00'),
            category: 'medical',
            subType: null,
            location: demoLocation(-73.5804, 45.4980, '1380 Sherbrooke St W, Montreal, QC'),
            requesterId: 'requester',
            helperId: 'paramedic',
            status: 'completed'
        },
        {
            requestTime: new Date('2025-06-02T09:15:00'),
            category: 'vehicle',
            subType: 'flat_tire',
            location: demoLocation(-73.5790, 45.4975, 'Peel St, Montreal, QC'),
            requesterId: 'dualuser',
            helperId: 'mechanic',
            status: 'completed'
        },
        {
            requestTime: new Date('2025-06-03T18:45:00'),
            category: 'home',
            subType: 'plumbing',
            location: demoLocation(-73.5780, 45.5010, 'Parc Ave, Montreal, QC'),
            requesterId: 'requester',
            helperId: 'plumber',
            status: 'completed'
        },
        {
            requestTime: new Date('2025-06-04T11:00:00'),
            category: 'pet',
            subType: null,
            location: demoLocation(-73.5730, 45.5020, 'Mont-Royal Ave, Montreal, QC'),
            requesterId: 'requester',
            helperId: 'vet',
            status: 'completed'
        }
    ];

    for (const reqData of sampleRequests) {
        const request = new Request(reqData);
        await request.save();
    }
    console.log('Created sample history requests');

    console.log('\nSeed complete. Demo accounts ready.');
    await mongoose.disconnect();
}

seed().catch(error => {
    console.error(error);
    process.exit(1);
});
