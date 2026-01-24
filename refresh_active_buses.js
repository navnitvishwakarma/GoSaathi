const mongoose = require('mongoose');

// MongoDB Connection
const MONGO_URI = "mongodb+srv://digloo:navnit@cluster0.lox2si6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const busSchema = new mongoose.Schema({
    busId: { type: String, required: true, unique: true },
    lat: Number,
    lng: Number,
    speed: Number,
    crowdLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    currentPassengers: { type: Number, default: 0 },
    femaleCount: { type: Number, default: 0 },
    maleCount: { type: Number, default: 0 },
    routeId: String,
    lastUpdated: { type: Date, default: Date.now }
});

const Bus = mongoose.model('Bus', busSchema);

async function refreshBuses() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Update all buses to be "active" now
        const now = new Date();
        const result = await Bus.updateMany(
            {},
            { $set: { lastUpdated: now, speed: Math.floor(Math.random() * 30) + 20 } } // Also randomize speed for variety
        );

        console.log(`Updated ${result.modifiedCount} buses to be active as of ${now.toISOString()}`);

        await mongoose.disconnect();
        console.log('✅ Disconnected');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

refreshBuses();
