const mongoose = require('mongoose');

const busAccountSchema = new mongoose.Schema({
    busId: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

module.exports = mongoose.model('BusAccount', busAccountSchema);
