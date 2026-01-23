const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true },
    busId: { type: String, required: true },
    destination: { type: String, required: true }, // Bus Stand Name
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);
