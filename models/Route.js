const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
    routeId: { type: String, required: true, unique: true }, // e.g., "7A"
    name: { type: String, required: true }, // e.g., "Station -> Manjalpur"
    source: { type: String, required: true },
    destination: { type: String, required: true },
    checkpoints: [
        {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
            name: { type: String } // Optional: Name of the stop/checkpoint
        }
    ]
});

module.exports = mongoose.model('Route', RouteSchema);
