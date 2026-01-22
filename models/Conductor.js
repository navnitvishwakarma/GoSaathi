const mongoose = require('mongoose');

const conductorSchema = new mongoose.Schema({
    name: { type: String },
    mobile: { type: String, required: true, unique: true },
    otp: { type: String }, // For simulation. In prod, use Redis/Cache
    isVerified: { type: Boolean, default: false },
    gender: { type: String },
    age: { type: Number },
    address: { type: String },
    empId: { type: String }, // Employee ID
    currentBusId: { type: String } // Which bus they are currently managing
});

module.exports = mongoose.model('Conductor', conductorSchema);
