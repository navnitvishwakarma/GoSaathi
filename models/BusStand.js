const mongoose = require('mongoose');

const BusStandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    lat: {
        type: Number,
        required: true
    },
    lng: {
        type: Number,
        required: true
    },
    isDepot: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('BusStand', BusStandSchema);
