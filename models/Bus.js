const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    busId: { type: String, required: true, unique: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    speed: { type: Number, default: 0 },
    crowdLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    currentPassengers: { type: Number, default: 0 },
    maleCount: { type: Number, default: 0 },
    femaleCount: { type: Number, default: 0 },
    routeId: { type: String },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bus', busSchema);
